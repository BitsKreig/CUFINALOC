// TimeTable.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const TimeTable = () => {
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

        // Convert backend structure to frontend-friendly format
        const formattedPhases = Object.entries(result.grouped_timetables || {}).map(
          ([phaseName, batches]) => ({
            name: phaseName,
            desc: `Generated for ${result.summary?.department || "Dept"} - ${result.summary?.semester || ""}`,
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
      <table className="min-w-full border border-gray-300 mt-2 text-sm">
        <thead>
          <tr className="bg-gray-100">
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
                <td className="border px-3 py-2 font-medium bg-gray-50">{day}</td>
                {row.map((subject, idx) => (
                  <td
                    key={idx}
                    className={`border px-3 py-2 text-center ${subject ? "text-gray-800" : "text-gray-300"}`}
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
    return <div className="p-8 text-center">Loading generated timetable...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (!timetableData) {
    return <div className="p-8 text-center">No timetable data available.</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-center">Generated Timetables</h1>

      <div className="bg-gray-50 p-4 rounded-lg border">
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
        <div key={phaseIndex} className="space-y-6 border-t pt-6">
          <h2 className="text-xl font-semibold text-brand-700">
            {phase.name.toUpperCase()} — <span className="text-gray-600 text-base">{phase.desc}</span>
          </h2>

          {/* --- OPTIONS --- */}
          {phase.options.map((option, optionIndex) => (
            <div key={optionIndex} className="border rounded-lg p-4 bg-white shadow-sm">
              <p className="font-semibold text-gray-700 mb-2">
                Option {optionIndex + 1} — Score: <span className="text-brand-700">{option.score}</span>
              </p>

              {/* Weekly counts */}
              <div className="text-sm text-gray-600 mb-3">
                {option.weekly_counts.map((s, i) => (
                  <span key={i} className="mr-4">
                    {s.subject}: {s.weekly}/week
                  </span>
                ))}
              </div>

              {/* --- SECTIONS --- */}
              {option.sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mt-3">
                  <h4 className="font-medium mb-2">Section: {section.section}</h4>
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