from flask import Flask, request, jsonify
from flask_cors import CORS  # Import the CORS library
from uuid import uuid4
import json
import time
import subprocess

# --- Helper function to generate batch letters ---
def get_batch_letters(num_batches):
    """Generate batch letters: e.g., 3 → ['A', 'B', 'C']"""
    return [chr(65 + i) for i in range(num_batches)]  # A=65 in ASCII

# Initialize the Flask application.
app = Flask(__name__)
# Enable CORS for all routes and all origins (including both 5173 and 5174)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"]}})

# --- In-Memory Data Storage (Temporary "Database") ---
# In a real-world application, this data would be stored in a database.
# We use a dictionary to simulate this for demonstration purposes.
timetables = {}

# --- Helper function to simulate the ML Model's behavior ---
def run_ml_model(input_data):
    """
    Executes the C++ machine learning model for timetable generation.
    It passes the input data as a JSON string to the C++ program's stdin
    and reads the generated timetable data as json string from stdout.
    """
    print("Executing C++ model to generate timetable...")

    import os
    # Define the absolute path to the compiled C++ executable
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "src"))
    cpp_executable = os.path.join(base_dir, "main.exe")  # Updated to use main_fixed_v2

    # Serialize the input data to a JSON string
    input_json = json.dumps(input_data)

    try:
        # Write input JSON to timetable.json in Backend/src
        input_file_path = os.path.join(base_dir, "timetable.json")
        with open(input_file_path, "w") as f:
            f.write(input_json)

        # Run the C++ executable with working directory set to Backend/src
        result = subprocess.run(
            [cpp_executable],
            cwd=base_dir,
            capture_output=True,
            text=True,
            input=input_json,
            check=True  # This will raise a CalledProcessError if the C++ program returns a non-zero exit code
        )

        output_json = result.stdout
        print("Raw output JSON from C++ program:", output_json)

        # Parse the JSON output back into a Python dictionary
        generated_timetables = json.loads(output_json)

        print("Successfully received data from C++ model.")
        return generated_timetables

    except FileNotFoundError as e:
        error_msg = f"Error: C++ executable not found at '{cpp_executable}'"
        print(error_msg)
        raise RuntimeError(error_msg) from e
    except subprocess.CalledProcessError as e:
        error_msg = f"Error: C++ program failed with exit code {e.returncode}. Stderr: {e.stderr}"
        print(error_msg)
        raise RuntimeError(error_msg) from e
    except json.JSONDecodeError as e:
        error_msg = "Error: Failed to decode JSON output from C++ program."
        print(error_msg)
        raise RuntimeError(error_msg) from e
    except Exception as e:
        error_msg = f"An unexpected error occurred in run_ml_model: {e}"
        print(error_msg)
        raise RuntimeError(error_msg) from e

# --- API Endpoints ---

@app.route('/api/schedule/generate', methods=['POST'])
def generate_timetable():
    """
    API endpoint to trigger the timetable generation with the new schema.
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid JSON input. Please provide a request body."}), 400

        # Ensure batches and semester are integers
        if "batches" in data:
            try:
                data["batches"] = int(data["batches"])
            except Exception:
                data["batches"] = 1
        else:
            data["batches"] = 1

        if "semester" in data:
            try:
                data["semester"] = int(data["semester"])
            except Exception:
                data["semester"] = 1
        else:
            data["semester"] = 1

        # Set default parameters if missing
        defaults = {
            "classrooms": 1,
            "subjects": ["Math", "Science", "English", "History"],
            "department": "Computer Science",
            "classesPerWeek": 5,
            "maxLeaves": 0,
            "numSubjects": 4,
        }
        for key, value in defaults.items():
            if key not in data or data[key] in [None, "", []]:
                data[key] = value

        # Special handling for subjects - preserve object structure for C++ compatibility
        if "subjects" in data:
            # Check if subjects array is empty or contains only empty objects
            if not data["subjects"] or len(data["subjects"]) == 0:
                data["subjects"] = defaults["subjects"]
            else:
                # Preserve the object structure with name and credits for C++ compatibility
                processed_subjects = []
                for subj in data["subjects"]:
                    if isinstance(subj, dict) and "name" in subj:
                        # Keep as object with name and credits
                        processed_subjects.append({
                            "name": subj["name"],
                            "credits": subj.get("credits", 1)  # Default to 1 if credits not specified
                        })
                    elif isinstance(subj, str):
                        # Convert string to object format
                        processed_subjects.append({
                            "name": subj,
                            "credits": 1  # Default credits for string format
                        })
                    else:
                        # Convert other formats to object
                        processed_subjects.append({
                            "name": str(subj),
                            "credits": 1
                        })
                data["subjects"] = processed_subjects

        generated_timetables = run_ml_model(data)

        # Get input params for naming
        department = data.get('department', 'Unknown')
        semester = data.get('semester', 1)
        num_batches = data.get('batches', 1)
        batch_letters = get_batch_letters(num_batches)

        # Group sections by phase, batch, option
        grouped_timetables = {}  # {phase: {batch: {option: [sections]}}}

        for phase_data in generated_timetables.get("phases", []):
            phase_name = phase_data.get("name", "unknown")
            grouped_timetables[phase_name] = {}

            for option_idx, option in enumerate(phase_data.get("options", [])):
                option_num = option_idx + 1  # 1-based

                # Temporary dict to group sections by batch in this phase/option
                temp_batch_sections = {letter: [] for letter in batch_letters}

                for section in option.get("sections", []):
                    section_copy = section.copy()
                    section_copy['phase'] = phase_name
                    section_copy['timetable_option'] = option_num

                    # Parse batch from section name, e.g., "CSE_5_A_1" -> "A"
                    section_name = section_copy.get('section', '')
                    parts = section_name.split('_')
                    parsed_batch = None
                    if len(parts) >= 3:
                        parsed_batch = parts[2]  # e.g., "A"

                    # Map to expected batch letter (ensure we have sections for each batch)
                    if parsed_batch in batch_letters:
                        temp_batch_sections[parsed_batch].append(section_copy)
                    else:
                        # Fallback: Assign to first batch or log warning
                        print(f"Warning: Unrecognized batch '{parsed_batch}' in section '{section_name}'")
                        if batch_letters:
                            temp_batch_sections[batch_letters[0]].append(section_copy)

                # Now, for each batch in this phase/option, create a grouped timetable
                for batch_letter in batch_letters:
                    sections_for_batch = temp_batch_sections.get(batch_letter, [])
                    if sections_for_batch:  # Only if sections exist
                        # Create timetable name: e.g., "CSE_5_A"
                        timetable_name = f"{department}_{semester}_{batch_letter}"
                        full_key = f"{timetable_name}_Phase{phase_name}_Option{option_num}"

                        # Group into one timetable object per batch/phase/option
                        batch_timetable = {
                            'name': timetable_name,
                            'full_name': full_key,
                            'phase': phase_name,
                            'batch': batch_letter,
                            'option': option_num,
                            'sections': sections_for_batch  # List of all sections for this batch
                        }

                        # Store with UUID for retrieval, but use full_key as secondary ID
                        timetable_id = str(uuid4())
                        timetables[timetable_id] = batch_timetable

                        # Add to grouped structure for response
                        if batch_letter not in grouped_timetables[phase_name]:
                            grouped_timetables[phase_name][batch_letter] = {}
                        grouped_timetables[phase_name][batch_letter][option_num] = {
                            'id': timetable_id,
                            'name': timetable_name,
                            'full_name': full_key,
                            'sections': sections_for_batch
                        }

        # Collect all timetable IDs
        timetable_ids = [opt['id'] for phase in grouped_timetables.values()
                         for batch in phase.values()
                         for opt in batch.values()
                         if 'id' in opt]

        print(f"Grouped timetables generated: {len(timetable_ids)} total, for {num_batches} batches across phases.")

        # Return structured response for UI
        response_data = {
            "success": "Timetables generated successfully.",
            "timetable_ids": timetable_ids,
            "grouped_timetables": grouped_timetables,  # For direct UI display: {phase: {batch: {option: {id, name, sections}}}}
            "summary": {
                "department": department,
                "semester": semester,
                "batches": batch_letters,
                "num_phases": len(grouped_timetables),
                "options_per_batch": 3  # Assuming 3 options
            }
        }

        return jsonify(response_data), 200

    except Exception as e:
        print(f"Error in generate_timetable endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/schedule/view/<timetable_id>', methods=['GET'])
def get_timetable(timetable_id):
    """
    API endpoint to retrieve a specific timetable by its ID.
    """
    try:
        print(f"Received request for timetable ID: {timetable_id}")
        timetable = timetables.get(timetable_id)
        if timetable:
            print(f"Found timetable for ID: {timetable_id}")
            return jsonify(timetable), 200
        else:
            print(f"Timetable not found for ID: {timetable_id}")
            return jsonify({"error": "Timetable not found."}), 404
    except Exception as e:
        print(f"Error in get_timetable endpoint: {e}")
        return jsonify({"error": str(e)}), 500

# --- Application Runner ---
if __name__ == '__main__':
    # Run the Flask app in debug mode, binding to all interfaces.
    app.run(host='0.0.0.0', debug=True, port=5002)
