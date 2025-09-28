import React, { useState } from "react";
import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';

export default function App() {
  const [formData, setFormData] = useState({
    classrooms: 1,
    batches: 1,
    subjects: [],
    newSubject: "",
    department: "",
    semester: "",
    classesPerWeek: 5,
    maxLeaves: 0,
    numSubjects: 0,
  });
  const [active, setActive] = useState("timetables");

  const departments = [
    "Computer Science",
    "Electronics",
    "Mechanical",
    "Civil",
    "Management",
  ];
  const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];

  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Random colors for subjects
  const getRandomColor = (subject) => {
    const colors = [
      "bg-red-200",
      "bg-green-200",
      "bg-blue-200",
      "bg-yellow-200",
      "bg-purple-200",
      "bg-pink-200",
      "bg-indigo-200",
    ];
    const index =
      subject.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      colors.length;
    return colors[index];
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddSubject = (idx) => {
    setFormData((prev) => {
      const updatedSubjects = [...prev.subjects];
      const subject = updatedSubjects[idx];

      // Only finalize if both fields are filled
      if (subject.name.trim() && subject.credits) {
        updatedSubjects[idx] = { ...subject, finalized: true };
        return {
          ...prev,
          subjects: updatedSubjects,
        };
      }

      return prev;
    });
  };

  const handleRemoveSubject = (index) => {
    setFormData((prev) => {
      // Remove the subject at the given index
      let updatedSubjects = prev.subjects.filter((_, i) => i !== index);

      // Always ensure at least one empty row exists
      if (updatedSubjects.length === 0) {
        updatedSubjects = [{ name: "", credits: "", finalized: false }];
      }

      return {
        ...prev,
        subjects: updatedSubjects,
      };
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let dataToSend = { ...formData };

      // Set default subjects if none provided
      if (!dataToSend.subjects || dataToSend.subjects.length === 0) {
        dataToSend.subjects = [
          {name: "Math", credits: 4},
          {name: "Science", credits: 3},
          {name: "English", credits: 3},
          {name: "History", credits: 3}
        ];
      } else {
        // Process custom subjects
        dataToSend.subjects = dataToSend.subjects.map((s) => {
          if (typeof s === "string") {
            return {name: s, credits: 1};
          } else {
            return {
              name: s.name || "Unknown",
              credits: parseInt(s.credits) || 1
            };
          }
        });
      }

      const response = await fetch(
        "http://127.0.0.1:5002/api/schedule/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      const { timetable_ids } = result;
      const uniqueIds = [...new Set(timetable_ids)]; // defensive dedupe

      const fetchedTimetables = [];
      for (const id of uniqueIds) {
        const viewResponse = await fetch(`http://127.0.0.1:5002/api/schedule/view/${id}`);
        if (!viewResponse.ok) {
          const errorText = await viewResponse.text();
          throw new Error(`Failed to fetch timetable ${id}, message: ${errorText}`);
        }
        const timetableData = await viewResponse.json();

        // Normalize each section's table -> 2D array
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        timetableData.sectionsData = timetableData.sections ? timetableData.sections.map(section => {
          const table = section.table || {};
          const periodsCount = (table.Mon) ? table.Mon.length : 0;
          const data = [];

          for (let p = 0; p < periodsCount; p++) {
            const row = [];
            for (const day of days) {
              let raw = (table?.[day]?.[p] ?? "");
              // Remove any leading/trailing quotes and also collapse repeated quotes inside
              // e.g. '"abc"' -> abc ; '""abc""' -> abc
              let cell = String(raw).replace(/^"+|"+$/g, "").trim();
              // Optional: if cell is JSON string like '["a","b"]' you can parse, but we'll keep plain text
              row.push(cell);
            }
            data.push(row);
          }

          section.data = data;
          return section;
        }) : [];

        // Normalize phase field: "phase1" -> "1"
        if (timetableData.phase) {
          timetableData.phase = String(timetableData.phase).replace(/^phase/i, "").trim();
        }
        fetchedTimetables.push(timetableData);
      }


      setTimetables(fetchedTimetables);
      setSuccess(`✅ Successfully generated ${fetchedTimetables.length} optimized timetables with your custom subjects!`);
    } catch (err) {
      console.error("Error in handleGenerate:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      let cursorY = margin;

      // header font
      doc.setFontSize(12);

      timetables.forEach((tt, index) => {
        // If not enough vertical space for title + table header, add a page
        const estimatedNeeded = 12 + 8; // title ~12, small buffer
        if (cursorY + estimatedNeeded > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }

        // Title
        // remove the word "phase" if it's already there, then add our own label
        const phaseLabel = String(tt.phase).replace(/^phase/i, "").trim();
        doc.text(`Batch ${tt.batch} - Timetable ${tt.timetable} - Phase ${phaseLabel}`, 10, cursorY);
        // Leave a little space then draw table
        const startYForTable = cursorY + 6;

        autoTable(doc, {
          startY: startYForTable,
          head: [["Mon", "Tue", "Wed", "Thu", "Fri"]],
          body: tt.data.map(row => row.map(cell => cell || "-")), // make sure no empty cell becomes undefined
          styles: { cellPadding: 2, fontSize: 9, halign: 'center' },
          headStyles: { fillColor: [240,240,240] },
          theme: 'grid',
          didDrawPage: () => {
            // nothing needed here, but available for headers/footers
          }
        });

        // Move cursor to position after the last table
        cursorY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 8 : startYForTable + 80;

        // Add a page if remaining space is small (so next title doesn't collide)
        if (cursorY > pageHeight - margin - 30 && index !== timetables.length - 1) {
          doc.addPage();
          cursorY = margin;
        }
      });

      doc.save("timetables.pdf");
    } catch (err) {
      console.error("Error in downloadPDF:", err);
      setError(`Failed to download PDF: ${err.message}`);
    }
  };


  const downloadExcel = () => {
    try {
      const wb = utils.book_new();
      const usedNames = new Set();
      timetables.forEach((tt) => {
        let sheetName = `Batch${tt.batch}-${tt.section || tt.phase || 'Unknown'}`;
        let counter = 1;
        let originalName = sheetName;
        while (usedNames.has(sheetName)) {
          sheetName = `${originalName}_${counter++}`;
        }
        usedNames.add(sheetName);
        const ws = utils.aoa_to_sheet([
          ["Mon", "Tue", "Wed", "Thu", "Fri"],
          ...tt.data,
        ]);
        utils.book_append_sheet(wb, ws, sheetName);
      });
      writeFile(wb, "timetables.xlsx");
    } catch (err) {
      console.error("Error in downloadExcel:", err);
      setError(`Failed to download Excel: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-600 text-white py-4 shadow-md">
        <h1 className="text-2xl font-bold text-center">
          Smart Classroom & Timetable Scheduler
        </h1>
        {/* <p className="text-center text-sm mt-1">Smart Scheduling System</p> */}
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md p-6">
          <ul className="space-y-4">
            {["📊 Dashboard", "📅 Timetables", "🏫 Classes", "⚙️ Settings"].map(
              (item, idx) => {
                const key = item.split(" ")[1].toLowerCase();
                return (
                  <li key={idx}>
                    <button
                      onClick={() => setActive(key)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition
                        ${active === key
                          ? "bg-blue-200 text-blue-900 font-semibold"
                          : "hover:bg-gray-100"
                        }`}
                    >
                      {item}
                    </button>
                  </li>
                );
              }
            )}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <h2 className="text-xl font-bold mb-6">Generate Timetable</h2>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
              {success}
            </div>
          )}

          {/* Form */}
          <div className="grid grid-cols-2 gap-6 bg-white p-6 shadow rounded-lg">
            <div>
              <label className="block font-medium">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="border p-2 w-full rounded"
              >
                <option value="">Select Department</option>
                {departments.map((dept, i) => (
                  <option key={i} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium">Semester</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="border p-2 w-full rounded"
              >
                <option value="">Select Semester</option>
                {semesters.map((sem, i) => (
                  <option key={i} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium">Number of Batches</label>
              <input
                type="number"
                name="batches"
                min="1"
                value={formData.batches}
                onChange={handleChange}
                className="border p-2 w-full rounded"
              />
            </div>

            {/* Subject Input */}
            <div className="col-span-2">
              <label className="block font-medium">No. of Subjects</label>
              <input
                type="number"
                name="numSubjects"
                value={formData.numSubjects}
                onChange={(e) => {
                  const num = parseInt(e.target.value);
                  let updatedSubjects = [...formData.subjects];
                  if (num > updatedSubjects.length) {
                    for (let i = updatedSubjects.length; i < num; i++) {
                      updatedSubjects.push({ name: "", credits: "" });
                    }
                  } else {
                    updatedSubjects = updatedSubjects.slice(0, num);
                  }
                  setFormData((prev) => ({
                    ...prev,
                    numSubjects: num,
                    subjects: updatedSubjects,
                  }));
                }}
                placeholder="Enter number of subjects"
                className="border p-2 w-full rounded"
              />

              {/* Dynamic rows */}
              <div className="mt-4 space-y-2">
                {formData.subjects?.map((subj, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-4 gap-2 bg-gray-100 p-2 rounded items-center"
                  >
                    <input
                      type="text"
                      placeholder="Subject Name"
                      value={subj.name}
                      onChange={(e) => {
                        const newSubjects = [...formData.subjects];
                        newSubjects[idx].name = e.target.value;
                        setFormData({ ...formData, subjects: newSubjects });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !subj.finalized) {
                          e.preventDefault();
                          handleAddSubject(idx);
                        }
                      }}
                      disabled={subj.finalized}
                      className="border p-2 rounded"
                    />

                    <input
                      type="number"
                      placeholder="Credits"
                      value={subj.credits}
                      onChange={(e) => {
                        const newSubjects = [...formData.subjects];
                        newSubjects[idx].credits = e.target.value;
                        setFormData({ ...formData, subjects: newSubjects });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !subj.finalized) {
                          e.preventDefault();
                          handleAddSubject(idx);
                        }
                      }}
                      disabled={subj.finalized}
                      className="border p-2 rounded"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ❌
                    </button>

                    {!subj.finalized && (
                      <button
                        type="button"
                        onClick={() => handleAddSubject(idx)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ➕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg transition-transform transform hover:scale-105 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Timetable"}
              </button>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  Error: {error}
                </div>
              )}

              {/* Download Buttons */}
              {timetables.length > 0 && (
                <div className="mt-4 space-x-4">
                  <button
                    onClick={downloadPDF}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Download PDF
                  </button>
                  <button
                    onClick={downloadExcel}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Download Excel
                  </button>
                </div>
              )}

              {/* Timetables */}
              <div className="mt-10">
                <h2 className="text-xl font-semibold mb-4">
                  Optimized Timetables
                </h2>
                {/* Group timetables by batch and phase */}
                {[...new Set(timetables.map(tt => tt.batch))].map(batchNum => {
                  // For each batch, get timetables
                  const batchTimetables = timetables.filter(tt => tt.batch === batchNum);
                  // Get unique phases
                  const phases = [...new Set(batchTimetables.map(tt => tt.phase))].sort((a,b) => a-b);

                  return (
                    <div key={batchNum} className="mb-8">
                      <h3 className="text-lg font-semibold mb-4">Batch {batchNum}</h3>
                      {phases.map(phaseNum => {
                        // For each phase, get timetables for options
                        const phaseTimetables = batchTimetables.filter(tt => tt.phase === phaseNum);
                        // Sort by option number
                        phaseTimetables.sort((a,b) => (a.option || 0) - (b.option || 0));

                        return (
                          <div key={phaseNum} className="mb-6">
                            <h4 className="text-md font-medium mb-2">Phase {phaseNum}</h4>
                            {phaseTimetables.map((tt, ttIdx) => (
                              <div key={ttIdx} className="mb-4">
                                <h5 className="font-semibold mb-2">Option {tt.option}</h5>
                                {tt.sectionsData.map((section, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="bg-white p-4 shadow rounded-lg border mb-4"
                                  >
                                    <h6 className="font-medium mb-2">{section.section}</h6>
                                    <table className="w-full border-collapse border text-center">
                                      <thead>
                                        <tr>
                                          <th className="border px-2 py-1">Mon</th>
                                          <th className="border px-2 py-1">Tue</th>
                                          <th className="border px-2 py-1">Wed</th>
                                          <th className="border px-2 py-1">Thu</th>
                                          <th className="border px-2 py-1">Fri</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {section.data.map((row, rIdx) => (
                                          <tr key={rIdx}>
                                            {row.map((cell, cIdx) => (
                                              <td
                                                key={cIdx}
                                                className={`border px-2 py-1 ${cell ? getRandomColor(cell) : ""
                                                  }`}
                                              >
                                                {cell || "-"}
                                              </td>
                                            ))}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
