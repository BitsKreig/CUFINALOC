// src/components/InputSection.jsx
import React from "react";
import { TrashIcon, PlusIcon } from "./Icons";

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
      subjects[i]
        ? subjects[i]
        : { name: "", credits: "", confirmed: false }
    );
    setSubjects(updated);
  };

  // Update a field inside a subject
  const updateSubjectField = (index, field, value) => {
    const updated = [...subjects];
    updated[index] = { ...(updated[index] || {}), [field]: value };
    setSubjects(updated);
  };

  // Confirm a subject (via + button or Enter)
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

  // Handle pressing Enter inside any subject field
  const handleKeyPress = (e, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirmSubject(index);
    }
  };

  // Remove a subject row
  const handleRemoveClick = (index) => {
    const updated = subjects.filter((_, i) => i !== index);
    setSubjects(updated);
  };

  return (
    <div className="md:col-span-2 space-y-6 bg-white p-6 rounded-lg shadow-sm transition-colors duration-300">
      {/* Department + Semester */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="label">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input w-full"
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
            className="input w-full"
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
            className="input w-full"
          />
        </div>

        <div>
          <label className="label">Number of Subjects</label>
          <input
            type="number"
            min="0"
            value={subjects.length}
            onChange={handleNumSubjectsChange}
            className="input w-full"
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
                className={`grid grid-cols-12 gap-2 items-center p-2 rounded border ${
                  subj.confirmed
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200"
                }`}
              >
                <div className="col-span-1 flex items-center justify-center text-sm text-gray-600">
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
                    className={`input w-full ${
                      subj.confirmed ? "bg-gray-100 cursor-not-allowed" : ""
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
                    className={`input w-full ${
                      subj.confirmed ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    title="Remove subject"
                    onClick={() => handleRemoveClick(idx)}
                    className="btn-ghost"
                  >
                    <TrashIcon />
                  </button>

                  <button
                    type="button"
                    title={
                      subj.confirmed
                        ? "Already confirmed"
                        : "Confirm subject"
                    }
                    onClick={() => handleConfirmSubject(idx)}
                    disabled={subj.confirmed}
                    className={`btn-ghost ${
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
