import { useEffect, useState } from "react";
import { TrashIcon, PlusIcon } from "./Icons";
import useTheme from "../useTheme";

const InputSection = ({
  setPayload, // parent can get final JSON for scheduler
}) => {
  const { theme } = useTheme();

  // ---------- States ----------
  const [departments, setDepartments] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedCodes, setSelectedCodes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------- Fetch Departments ----------
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch("http://localhost:5002/api/data/departments");
        const data = await res.json();
        setDepartments(data.departments || []);
      } catch (err) {
        console.error("Error fetching departments:", err);
        setError("Failed to load departments.");
      }
    };
    fetchDepartments();
  }, []);

  // ---------- Fetch Semesters when Department Selected ----------
  useEffect(() => {
    if (!selectedDept) return;
    const fetchSemesters = async () => {
      try {
        const res = await fetch(
          `http://localhost:5002/api/data/semesters?department=${selectedDept}`
        );
        const data = await res.json();
        setSemesters(data.semesters || []);
      } catch (err) {
        console.error("Error fetching semesters:", err);
        setError("Failed to load semesters.");
      }
    };
    fetchSemesters();
  }, [selectedDept]);

  // ---------- Fetch Subjects based on Department + Semester ----------
  useEffect(() => {
    if (!selectedDept || !selectedSemester) return;
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://localhost:5002/api/data/subjects?department=${selectedDept}&semester=${selectedSemester}`
        );
        const data = await res.json();
        setSubjects(data.subjects || []);
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setError("Failed to load subjects.");
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [selectedDept, selectedSemester]);

  // ---------- Handle Subject Code Selection ----------
  const handleCodeSelect = async (code) => {
    if (selectedCodes.some((c) => c.code === code)) return; // avoid duplicates

    try {
      const res = await fetch(`http://localhost:5002/api/data/subject/${code}`);
      const data = await res.json();

      const subject = {
        code: data.code,
        name: data.name,
        credits: data.credits,
      };

      setSelectedCodes((prev) => [...prev, subject]);
    } catch (err) {
      console.error("Error fetching subject details:", err);
    }
  };

  // ---------- Remove Subject ----------
  const handleRemoveSubject = (code) => {
    setSelectedCodes((prev) => prev.filter((s) => s.code !== code));
  };

  // ---------- Send payload to parent ----------
  useEffect(() => {
    const payload = {
      department: selectedDept,
      semester: selectedSemester,
      subjects: selectedCodes,
    };
    setPayload(payload);
  }, [selectedDept, selectedSemester, selectedCodes]);

  // ---------- UI ----------
  return (
    <div className="space-y-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 rounded-lg shadow-sm transition-colors duration-300">
      {/* --- Department --- */}
      <div>
        <label className="label font-medium">Department</label>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="input w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d.id || d} value={d.name || d}>
              {d.name || d}
            </option>
          ))}
        </select>
      </div>

      {/* --- Semester --- */}
      <div>
        <label className="label font-medium">Semester</label>
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="input w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
          disabled={!selectedDept}
        >
          <option value="">Select Semester</option>
          {semesters.map((s) => (
            <option key={s.id || s} value={s.value || s}>
              Semester {s.value || s}
            </option>
          ))}
        </select>
      </div>

      {/* --- Subject Codes --- */}
      <div>
        <label className="label font-medium">Add Subject Code</label>
        <select
          onChange={(e) => handleCodeSelect(e.target.value)}
          className="input w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
          disabled={!selectedSemester || loading}
        >
          <option value="">Select Subject Code</option>
          {subjects.map((s) => (
            <option key={s.code} value={s.code}>
              {s.code} — {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* --- Selected Subjects List --- */}
      {selectedCodes.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Selected Subjects</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
            {selectedCodes.map((subj, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                <div>
                  <p className="font-medium">{subj.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Code: {subj.code} | Credits: {subj.credits}
                  </p>
                </div>
                <button
                  className="text-red-500 hover:text-red-400"
                  onClick={() => handleRemoveSubject(subj.code)}
                >
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</div>
      )}
    </div>
  );
};

export default InputSection;
