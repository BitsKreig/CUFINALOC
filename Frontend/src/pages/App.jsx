// App.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Components
import SidebarHeader from "../components/SidebarHeader";
import InputSection from "../components/InputSection";
import ThemeToggle from "../components/ThemeToggle";

// Functions (from appFunctions.js)
import { scrollToSection } from "../components/appFunctions";

// Theme hook (for ThemeToggle)
import useTheme from "../useTheme";

const App = () => {
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [batchCount, setBatchCount] = useState(1);
  const [subjects, setSubjects] = useState([]);

  const inputSectionRef = useRef(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Generate timetable → builds payload exactly as backend expects
  const onGenerateTimetable = async () => {
    const payload = {
      batches: Number(batchCount) || 1,
      department: department || "",
      semester: Number(semester) || 1,
      subjects: (subjects || []).map((s) => ({
        name: String(s.name || "").trim(),
        credits: Number(s.credits || 1),
      })),
    };

    if (!payload.department || !payload.semester) {
      alert("Please select department and semester.");
      return;
    }

    if (!payload.subjects || payload.subjects.length === 0) {
      alert("Please add at least one subject.");
      return;
    }

    try {
      localStorage.setItem("timetableRequestPayload", JSON.stringify(payload));
    } catch (e) {
      console.warn("Could not write timetable payload to localStorage", e);
    }

    navigate("/timetable", { state: { payload } });
  };

  return (
    <div className="flex h-screen bg-ink-25 text-ink-800">
      <SidebarHeader onScrollToInput={() => scrollToSection(inputSectionRef)} />

      <main className="flex-1 overflow-y-auto p-10 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ink-900">
            Timetable Generator
          </h1>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>

        <section ref={inputSectionRef}>
          <InputSection
            department={department}
            semester={semester}
            batchCount={batchCount}
            subjects={subjects}
            setDepartment={setDepartment}
            setSemester={setSemester}
            setBatchCount={setBatchCount}
            setSubjects={setSubjects}
          />
        </section>

        <div className="flex justify-end pt-6">
          <button
            onClick={onGenerateTimetable}
            className="btn-primary px-6 py-2 hover-lift"
          >
            Generate Timetable
          </button>
        </div>
      </main>
    </div>
  );
};

export default App;
