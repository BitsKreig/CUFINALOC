import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useTheme from "../useTheme";
import ThemeToggle from "../components/ThemeToggle";

const TimeTable = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const payload =
    location.state?.payload ||
    JSON.parse(localStorage.getItem("timetableRequestPayload") || "{}");

  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const generateTimetable = async () => {
      if (!payload || !payload.department) {
        setError("Missing timetable input data. Please go back and try again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await fetch("http://localhost:5002/api/schedule/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const result = await response.json();
        if (result.error) throw new Error(result.error);

        const formattedPhases = Object.entries(result.grouped_timetables || {}).map(
          ([phaseName, batches]) => ({
            name: phaseName,
            desc: `Generated for ${result.summary?.department || "Dept"} - ${result.summary?.semester || ""
              }`,
            options: Object.entries(batches || {}).map(([batchName, options]) => ({
              batch: batchName,
              score: "",
              weekly_counts: [],
              sections: Object.values(options || {}).map((opt) => ({
                section: opt.name || "Unnamed",
                table: opt.sections?.[0]?.table || {},
              })),
            })),
          })
        );

        const formattedResult = {
          meta: {
            department: result.summary?.department,
            semester: result.summary?.semester,
            days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
            periods_per_day: 6,
          },
          phases: formattedPhases,
        };

        setTimetableData(formattedResult);
      } catch (err) {
        console.error("Error generating timetable:", err);
        setError(err.message || "Failed to generate timetable");
      } finally {
        setLoading(false);
      }
    };

    generateTimetable();
  }, [payload]);

  // --- Render Table Function ---
  const renderTable = (days, tableData) => {
    const periods = timetableData?.meta?.periods_per_day || 6;
    return (
      <table className="min-w-full border border-gray-300 dark:border-gray-700 mt-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-800">
            <th className="border px-3 py-2 text-left">Day</th>
            {Array.from({ length: periods }).map((_, i) => (
              <th key={i} className="border px-3 py-2 text-center">
                P{i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const row = (tableData && tableData[day]) || Array.from({ length: periods }).map(() => null);
            return (
              <tr key={day}>
                <td className="border px-3 py-2 font-medium bg-gray-50 dark:bg-gray-800">
                  {day}
                </td>
                {row.map((subject, idx) => (
                  <td
                    key={idx}
                    className={`border px-3 py-2 text-center ${subject
                      ? "text-gray-800 dark:text-gray-100"
                      : "text-gray-300 dark:text-gray-400"
                      }`}
                  >
                    {subject || "-"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        Loading generated timetable...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-red-600 dark:text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  if (!timetableData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        No timetable data available.
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-center flex-1">Generated Timetables</h1>
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
        <p>
          <strong>Department:</strong> {timetableData.meta?.department}
        </p>
        <p>
          <strong>Semester:</strong> {timetableData.meta?.semester}
        </p>
        <p>
          <strong>Days:</strong> {timetableData.meta?.days.join(", ")}
        </p>
        <p>
          <strong>Periods per day:</strong> {timetableData.meta?.periods_per_day}
        </p>
      </div>

      {/* --- PHASES --- */}
      {timetableData.phases.map((phase, phaseIndex) => (
        <div key={phaseIndex} className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-xl font-semibold text-brand-700">
            {phase.name.toUpperCase()} —{" "}
            <span className="text-gray-600 dark:text-gray-400 text-base">{phase.desc}</span>
          </h2>

          {/* --- OPTIONS --- */}
          {phase.options.map((option, optionIndex) => (
            <div
              key={optionIndex}
              className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-800 shadow-sm transition-all duration-300"
            >
              <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                Option {optionIndex + 1} — Score:{" "}
                <span className="text-brand-700">{option.score}</span>
              </p>

              {/* Weekly counts */}
              <div className="text-sm mb-3 text-gray-700 dark:text-gray-300">
                {option.weekly_counts.map((s, i) => (
                  <span key={i} className="mr-4">
                    {s.subject}: {s.weekly}/week
                  </span>
                ))}
              </div>

              {/* --- SECTIONS --- */}
              {option.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mt-3">
                  <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-200">
                    Section: {section.section}
                  </h4>
                  <div className="overflow-x-auto">
                    {renderTable(timetableData.meta.days, section.table)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TimeTable;
