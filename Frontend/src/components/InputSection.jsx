import { TrashIcon, PlusIcon } from "./Icons";
import useTheme from "../useTheme";

const InputSection = ({
  department,
  semester,
  batchCount,
  subjects,
  setDepartment,
  setSemester,
  setBatchCount,
  setSubjects,
}) => {
  const { theme, toggleTheme } = useTheme();

  const departments = [
    "Computer Science",
    "CSE",
    "IT",
    "ECE",
    "EEE",
    "ME",
    "CE",
  ];
  const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];

  // Adjust number of subject rows
  const handleNumSubjectsChange = (e) => {
    const num = Math.max(0, parseInt(e.target.value || "0", 10));
    const updated = Array.from({ length: num }).map((_, i) =>
      subjects[i] ? subjects[i] : { name: "", credits: "", confirmed: false }
    );
    setSubjects(updated);
  };

  // Update a field inside a subject
  const updateSubjectField = (index, field, value) => {
    const updated = [...subjects];
    updated[index] = { ...(updated[index] || {}), [field]: value };
    setSubjects(updated);
  };

  // Confirm a subject
  const handleConfirmSubject = (index) => {
    const s = subjects[index];
    if (!s?.name?.trim() || !s?.credits?.toString().trim()) {
      alert("Please fill both Subject Name and Credits before confirming.");
      return;
    }
    const updated = [...subjects];
    updated[index] = {
      name: s.name.trim(),
      credits: s.credits.trim(),
      confirmed: true,
    };
    setSubjects(updated);
  };

  // Enter key confirm
  const handleKeyPress = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirmSubject(index);
    }
  };

  // Remove a subject
  const handleRemoveClick = (index) => {
    const updated = subjects.filter((_, i) => i !== index);
    setSubjects(updated);
  };

  return (
    <div className="md:col-span-2 space-y-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded-lg shadow-sm transition-colors duration-300">
      {/* Department + Semester */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 transition-colors duration-300 rounded-md"
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Semester</label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="input w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 transition-colors duration-300 rounded-md"
          >
            <option value="">Select Semester</option>
            {semesters.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Batches + Subjects Count */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">Number of Batches</label>
          <input
            type="number"
            min="1"
            value={batchCount}
            onChange={(e) =>
              setBatchCount(Math.max(1, parseInt(e.target.value || "1", 10)))
            }
            className="input w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 transition-colors duration-300 rounded-md"
          />
        </div>

        <div>
          <label className="label">Number of Subjects</label>
          <input
            type="number"
            min="0"
            value={subjects.length}
            onChange={handleNumSubjectsChange}
            className="input w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 transition-colors duration-300 rounded-md"
          />
        </div>
      </div>

      {/* Subject List */}
      {subjects.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Subjects</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {subjects.map((subj, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-12 gap-2 items-center p-2 rounded border transition-colors duration-300 ${
                  subj.confirmed
                    ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                    : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
                }`}
              >
                <div className="col-span-1 flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
                  {idx + 1}
                </div>

                <div className="col-span-6">
                  <input
                    type="text"
                    placeholder="Subject name"
                    value={subj.name || ""}
                    disabled={subj.confirmed}
                    onKeyDown={(e) => handleKeyPress(e, idx)}
                    onChange={(e) =>
                      updateSubjectField(idx, "name", e.target.value)
                    }
                    className={`input w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 transition-colors duration-300 rounded-md ${
                      subj.confirmed ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    placeholder="Credits"
                    value={subj.credits || ""}
                    disabled={subj.confirmed}
                    onKeyDown={(e) => handleKeyPress(e, idx)}
                    onChange={(e) =>
                      updateSubjectField(idx, "credits", e.target.value)
                    }
                    className={`input w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 transition-colors duration-300 rounded-md ${
                      subj.confirmed ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    title="Remove subject"
                    onClick={() => handleRemoveClick(idx)}
                    className="btn-ghost text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-300"
                  >
                    <TrashIcon />
                  </button>

                  <button
                    type="button"
                    title={
                      subj.confirmed ? "Already confirmed" : "Confirm subject"
                    }
                    onClick={() => handleConfirmSubject(idx)}
                    disabled={subj.confirmed}
                    className={`btn-ghost text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-300 ${
                      subj.confirmed ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <PlusIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InputSection;
