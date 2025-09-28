import React, { useState, useRef, useEffect } from "react";
import useTheme from "./useTheme";
import ThemeToggle from "./components/ThemeToggle";
import { utils, writeFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  TrashIcon,
  PlusIcon,
  LayoutDashboardIcon,
  CalendarIcon,
  BuildingIcon,
  CogIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from "./components/Icons";
// Removed BackButton in favor of making the heading clickable as back

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

  // Default departments list; users can add more below
  const defaultDepartments = [
    "Computer Science",
    "Electronics",
    "Mechanical",
    "Civil",
    "Management",
  ];
  // Custom departments (persisted to localStorage)
  const [customDepartments, setCustomDepartments] = useState([]);
  const [addingDept, setAddingDept] = useState(false);
  const [newDept, setNewDept] = useState("");
  const allDepartments = React.useMemo(() => {
    const seen = new Set();
    const out = [];
    [...defaultDepartments, ...customDepartments].forEach((d) => {
      const key = String(d).trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        out.push(String(d).trim());
      }
    });
    return out;
  }, [defaultDepartments, customDepartments]);
  const semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];

  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  // Toast state for success popup
  const [toastVisible, setToastVisible] = useState(false);
  const [toastHiding, setToastHiding] = useState(false);
  const toastTimerRef = useRef(null);
  const toastHideTimerRef = useRef(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const batchRefs = useRef({});
  // Vertical scroll container refs per batch (for phase navigation)
  const vScrollRefs = useRef({});
  // Phase item refs within a batch's vertical list
  const phaseItemRefs = useRef({}); // { [batch]: { [phase]: ref } }
  // Horizontal scroll refs per batch->phase to sync scrolling across phases
  const hScrollRefs = useRef({}); // { [batch]: { [phase]: ref } }
  // Flags to prevent recursive scroll updates
  const hScrollIgnore = useRef(new WeakSet());
  const { theme, toggleTheme } = useTheme();

  // Load any previously saved custom departments
  useEffect(() => {
    try {
      const raw = localStorage.getItem("customDepartments");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCustomDepartments(parsed.filter((s) => typeof s === "string"));
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const saveCustomDepartments = (list) => {
    try {
      localStorage.setItem("customDepartments", JSON.stringify(list));
    } catch (e) {
      // ignore
    }
  };

  // Make the heading behave like a back button without changing its look
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/"; // fallback route
    }
  };

  // Scroll reveal animations for phases (vertical) and option cards (horizontal)
  useEffect(() => {
    // Vertical reveal for any element with .reveal-y
    const vEls = Array.from(document.querySelectorAll('.reveal-y'));
    const vObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.classList.add('in-view');
        else entry.target.classList.remove('in-view');
      }
    }, { root: null, threshold: 0.1 });
    vEls.forEach((el) => vObserver.observe(el));

    // Horizontal reveal per scroller
    const hScrollers = Array.from(document.querySelectorAll('.hscroll-interactive'));
    const hObservers = [];
    for (const scroller of hScrollers) {
      const cards = Array.from(scroller.querySelectorAll('.tt-card'));
      const hObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add('in-view');
          else entry.target.classList.remove('in-view');
        }
      }, { root: scroller, threshold: 0.25, rootMargin: '0px' });
      cards.forEach((el) => hObserver.observe(el));
      hObservers.push(hObserver);
    }

    return () => {
      vObserver.disconnect();
      hObservers.forEach((obs) => obs.disconnect());
    };
  }, [timetables]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
    };
  }, []);

  // (mobile drawer removed) 

  const getBatchRef = (batch) => {
    if (!batchRefs.current[batch]) {
      batchRefs.current[batch] = React.createRef();
    }
    return batchRefs.current[batch];
  };

  const getVScrollRef = (batch) => {
    if (!vScrollRefs.current[batch]) {
      vScrollRefs.current[batch] = React.createRef();
    }
    return vScrollRefs.current[batch];
  };

  const getPhaseItemRef = (batch, phase) => {
    if (!phaseItemRefs.current[batch]) phaseItemRefs.current[batch] = {};
    if (!phaseItemRefs.current[batch][phase]) {
      phaseItemRefs.current[batch][phase] = React.createRef();
    }
    return phaseItemRefs.current[batch][phase];
  };

  const getHScrollRef = (batch, phase) => {
    if (!hScrollRefs.current[batch]) hScrollRefs.current[batch] = {};
    if (!hScrollRefs.current[batch][phase]) {
      hScrollRefs.current[batch][phase] = React.createRef();
    }
    return hScrollRefs.current[batch][phase];
  };

  const scrollToBatch = (batch) => {
    const el = batchRefs.current[batch]?.current;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToPhase = (batch, phase) => {
    const container = vScrollRefs.current[batch]?.current;
    const target = phaseItemRefs.current[batch]?.[phase]?.current;
    if (!container || !target) return;
    // Compute target top relative to container
    const targetTop = target.offsetTop - container.offsetTop;
    container.scrollTo({ top: targetTop - 8, behavior: "smooth" });
  };

  // Sync horizontal scroll across all phases of the same batch using ratio
  const onHorizontalScroll = (batch, phase, e) => {
    const src = e.currentTarget;
    if (hScrollIgnore.current.has(src)) return;
    const maxSrc = Math.max(1, src.scrollWidth - src.clientWidth);
    const ratio = src.scrollLeft / maxSrc;
    const phases = hScrollRefs.current[batch] || {};
    Object.entries(phases).forEach(([p, ref]) => {
      const el = ref?.current;
      if (!el || el === src) return;
      const maxDst = Math.max(1, el.scrollWidth - el.clientWidth);
      const dst = ratio * maxDst;
      hScrollIgnore.current.add(el);
      el.scrollLeft = dst;
      // release ignore flag on next frame
      requestAnimationFrame(() => hScrollIgnore.current.delete(el));
    });
  };

  // Update custom cursor arrow and position in horizontal scroll areas
  const onHScrollMouseMove = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dir = x < rect.width / 2 ? "<" : ">";
    el.dataset.cursor = dir;
    el.style.setProperty("--cursor-x", `${x}px`);
    el.style.setProperty("--cursor-y", `${y}px`);
  };

  // Clear custom cursor when leaving the interactive area
  const onHScrollMouseLeave = (e) => {
    const el = e.currentTarget;
    el.dataset.cursor = "";
  };

  // Click on empty space in scroller to scroll by direction
  const onHScrollClick = (e) => {
    // If a card handled the click, it will stop propagation, so we only handle true container clicks
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const step = Math.max(200, Math.floor(el.clientWidth * 0.8));
    const delta = x < rect.width / 2 ? -step : step;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  // Subtle 3D hover effect handlers for option cards (clean, no cursor tracking)
  const onCardMouseEnter = (e) => {
    const el = e.currentTarget;
    el.classList.add("card-3d-active");
    // Keep tilt neutral for a clean look; add a slight elevation only
    el.style.setProperty("--tiltX", "0deg");
    el.style.setProperty("--tiltY", "0deg");
    el.style.setProperty("--elev", "8px");
  };
  const onCardMouseLeave = (e) => {
    const el = e.currentTarget;
    el.classList.remove("card-3d-active");
    el.style.setProperty("--tiltX", "0deg");
    el.style.setProperty("--tiltY", "0deg");
    el.style.setProperty("--elev", "0px");
  };

  // Center a clicked timetable card within its horizontal container
  const centerCardInView = (container, card) => {
    if (!container || !card) return;
    const targetLeft = card.offsetLeft - (container.clientWidth - card.clientWidth) / 2;
    container.scrollTo({ left: targetLeft, behavior: "smooth" });
  };

  // Scroll to and center the next option card in a phase scroller
  const handleNextOption = (batch, phase) => {
    const el = getHScrollRef(batch, phase)?.current;
    if (!el) return;
    const children = Array.from(el.children || []);
    if (!children.length) return;
    const currentLeft = el.scrollLeft;
    // find the first card whose left edge is just ahead of current scroll
    let nextCard = null;
    for (const child of children) {
      if (child.offsetLeft > currentLeft + 8) {
        nextCard = child;
        break;
      }
    }
    // if none ahead, keep at last card
    if (!nextCard) nextCard = children[children.length - 1];
    centerCardInView(el, nextCard);
  };

  // Random color by subject string
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
    const index = subject
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
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
      if (subject?.name?.trim() && subject?.credits) {
        updatedSubjects[idx] = { ...subject, finalized: true };
        return { ...prev, subjects: updatedSubjects };
      }
      return prev;
    });
  };

  const handleRemoveSubject = (index) => {
    setFormData((prev) => {
      let updatedSubjects = prev.subjects.filter((_, i) => i !== index);
      if (updatedSubjects.length === 0) {
        updatedSubjects = [{ name: "", credits: "", finalized: false }];
      }
      return { ...prev, subjects: updatedSubjects };
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let dataToSend = { ...formData };

      if (!dataToSend.subjects || dataToSend.subjects.length === 0) {
        dataToSend.subjects = [
          { name: "Math", credits: 4 },
          { name: "Science", credits: 3 },
          { name: "English", credits: 3 },
          { name: "History", credits: 3 },
        ];
      } else {
        dataToSend.subjects = dataToSend.subjects.map((s) => {
          if (typeof s === "string") return { name: s, credits: 1 };
          return { name: s.name || "Unknown", credits: parseInt(s.credits) || 1 };
        });
      }

      const response = await fetch(
        "http://127.0.0.1:5002/api/schedule/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dataToSend),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();
      const { timetable_ids } = result;
      const uniqueIds = [...new Set(timetable_ids)];

      const fetchedTimetables = [];
      for (const id of uniqueIds) {
        const viewResponse = await fetch(
          `http://127.0.0.1:5002/api/schedule/view/${id}`
        );
        if (!viewResponse.ok) {
          const errorText = await viewResponse.text();
          throw new Error(
            `Failed to fetch timetable ${id}, message: ${errorText}`
          );
        }
        const timetableData = await viewResponse.json();

        const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
        timetableData.sectionsData = timetableData.sections
          ? timetableData.sections.map((section) => {
              const table = section.table || {};
              const periodsCount = table.Mon ? table.Mon.length : 0;
              const data = [];
              for (let p = 0; p < periodsCount; p++) {
                const row = [];
                for (const day of days) {
                  const raw = table?.[day]?.[p] ?? "";
                  const cell = String(raw).replace(/^"+|"+$/g, "").trim();
                  row.push(cell);
                }
                data.push(row);
              }
              return { ...section, data };
            })
          : [];

        if (timetableData.phase) {
          timetableData.phase = String(timetableData.phase)
            .replace(/^phase/i, "")
            .trim();
        }
        fetchedTimetables.push(timetableData);
      }

      setTimetables(fetchedTimetables);
      // Set success message (no emoji) and show toast with auto-dismiss
      setSuccess(
        `Successfully generated ${fetchedTimetables.length} optimized timetables with your custom subjects!`
      );
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
      setToastHiding(false);
      setToastVisible(true);
      // Auto-hide after a short delay with a smooth exit animation
      toastTimerRef.current = setTimeout(() => {
        setToastHiding(true);
        toastHideTimerRef.current = setTimeout(() => {
          setToastVisible(false);
          setToastHiding(false);
          setSuccess(null);
        }, 250); // match CSS transition duration
      }, 2800);
    } catch (err) {
      console.error("Error in handleGenerate:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const margin = 10;
      let cursorY = margin;
      doc.setFontSize(12);

      timetables.forEach((tt, tIdx) => {
        const phaseLabel = String(tt.phase || "").replace(/^phase/i, "").trim();
        const title = `Batch ${tt.batch || "-"} • Option ${tt.option || "-"} • Phase ${phaseLabel || "-"}`;
        doc.text(title, margin, cursorY);
        cursorY += 6;

        (tt.sectionsData || []).forEach((section, sIdx) => {
          doc.setFontSize(11);
          doc.text(`${section.section || "Section"}`, margin, cursorY);
          cursorY += 4;
          autoTable(doc, {
            startY: cursorY,
            head: [["Mon", "Tue", "Wed", "Thu", "Fri"]],
            body: (section.data || []).map((row) =>
              row.map((cell) => (cell ? String(cell) : "-"))
            ),
            styles: { cellPadding: 2, fontSize: 9, halign: "center" },
            headStyles: { fillColor: [240, 240, 240] },
            theme: "grid",
          });
          // Update cursor after table
          cursorY = (doc.lastAutoTable?.finalY || cursorY) + 8;
          // If near bottom, new page
          const pageHeight = doc.internal.pageSize.getHeight();
          if (cursorY > pageHeight - margin - 20) {
            doc.addPage();
            cursorY = margin;
          }
        });

        if (tIdx !== timetables.length - 1) {
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
      const used = new Set();
      timetables.forEach((tt) => {
        (tt.sectionsData || []).forEach((section) => {
          const base = `B${tt.batch || "-"}-P${tt.phase || "-"}-O${tt.option || "-"}-${
            section.section || "Section"
          }`;
          let name = base.slice(0, 31);
          let i = 1;
          while (used.has(name)) {
            name = `${base}`.slice(0, 28) + `_${i++}`;
          }
          used.add(name);
          const ws = utils.aoa_to_sheet([
            ["Mon", "Tue", "Wed", "Thu", "Fri"],
            ...(section.data || []),
          ]);
          utils.book_append_sheet(wb, ws, name);
        });
      });
      writeFile(wb, "timetables.xlsx");
    } catch (err) {
      console.error("Error in downloadExcel:", err);
      setError(`Failed to download Excel: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-ink-100">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <h1
              className="font-display text-2xl md:text-3xl tracking-tight"
              role="button"
              tabIndex={0}
              title="Go back"
              onClick={goBack}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goBack();
                }
              }}
            >
              <span className="text-brand-700">Opti</span>
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">Class</span>
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </div>
      </header>


      <div className={`container grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 py-6`}>
        {/* Sidebar */}
        <aside
          className={`hidden md:block card h-fit md:sticky md:top-20 overflow-hidden transition-all duration-300 ${
            sidebarExpanded ? 'w-64 p-4' : 'w-16 p-2'
          }`}
          aria-label="Sidebar navigation"
          aria-expanded={sidebarExpanded}
        >
          <div className={`flex items-center ${sidebarExpanded ? 'justify-between' : 'justify-center'} mb-2`}>
            {sidebarExpanded && (
              <div className="font-semibold text-ink-700">Menu</div>
            )}
            <button
              type="button"
              className="btn-ghost text-lg"
              aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
              title={sidebarExpanded ? 'Collapse' : 'Expand'}
              onClick={() => setSidebarExpanded((v) => !v)}
            >
              {sidebarExpanded ? '«' : '»'}
            </button>
          </div>
          <nav>
            <ul className="space-y-2">
              {[
                { key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboardIcon },
                { key: 'timetables', label: 'Timetables', Icon: CalendarIcon },
                { key: 'classes', label: 'Classes', Icon: BuildingIcon },
                { key: 'settings', label: 'Settings', Icon: CogIcon },
              ].map(({ key, label, Icon }) => {
                const isActive = active === key;
                return (
                  <li key={key}>
                    <button
                      onClick={() => setActive(key)}
                      className={`w-full flex items-center gap-3 rounded-lg transition-colors px-3 py-2 ${
                        sidebarExpanded ? 'justify-start' : 'justify-center'
                      } ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 border border-brand-100'
                          : 'hover:bg-ink-100'
                      }`}
                      title={label}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="text-xl" aria-hidden />
                      {sidebarExpanded && (
                        <span className="whitespace-nowrap">{label}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="space-y-6">
          <h2 className="text-lg md:text-xl font-semibold text-ink-800 reveal-y">
            Generate Timetable
          </h2>

          {/* Success Toast Popup (no emoji) */}
          {toastVisible && (
            <div className="fixed top-4 right-4 z-30">
              <div
                role="status"
                aria-live="polite"
                className={`card border-l-4 border-brand-500 shadow-lg p-4 text-sm min-w-[18rem] transition-all duration-250 transform ${
                  toastHiding ? 'opacity-0 translate-y-2 scale-[0.98]' : 'opacity-100 translate-y-0 scale-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="text-brand-600 mt-0.5" />
                  <div className="text-ink-800">
                    <div className="font-medium mb-0.5">Success</div>
                    <div>{success}</div>
                  </div>
                  <button
                    type="button"
                    className="ml-auto btn-ghost text-ink-500"
                    onClick={() => {
                      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                      if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
                      setToastHiding(true);
                      toastHideTimerRef.current = setTimeout(() => {
                        setToastVisible(false);
                        setToastHiding(false);
                        setSuccess(null);
                      }, 250);
                    }}
                    title="Dismiss"
                    aria-label="Dismiss notification"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="card p-6 shadow-card reveal-y">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="input w-full hover-lift"
                >
                  <option value="">Select Department</option>
                  {allDepartments.map((dept, i) => (
                    <option key={i} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <div className="mt-2">
                  {!addingDept ? (
                    <button
                      type="button"
                      className="btn-ghost inline-flex items-center gap-1 text-sm"
                      onClick={() => setAddingDept(true)}
                      title="Add department"
                    >
                      <PlusIcon />
                      <span>Add department</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newDept}
                        onChange={(e) => setNewDept(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const name = String(newDept).trim();
                            if (!name) return;
                            const exists = allDepartments.some(
                              (d) => d.toLowerCase() === name.toLowerCase()
                            );
                            if (!exists) {
                              const updated = [...customDepartments, name];
                              setCustomDepartments(updated);
                              saveCustomDepartments(updated);
                            }
                            setFormData((prev) => ({ ...prev, department: name }));
                            setAddingDept(false);
                            setNewDept("");
                          }
                        }}
                        className="input flex-1"
                        placeholder="Enter new department"
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          const name = String(newDept).trim();
                          if (!name) return;
                          const exists = allDepartments.some(
                            (d) => d.toLowerCase() === name.toLowerCase()
                          );
                          if (!exists) {
                            const updated = [...customDepartments, name];
                            setCustomDepartments(updated);
                            saveCustomDepartments(updated);
                          }
                          setFormData((prev) => ({ ...prev, department: name }));
                          setAddingDept(false);
                          setNewDept("");
                        }}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => {
                          setAddingDept(false);
                          setNewDept("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="label">Semester</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="input w-full hover-lift"
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
                <label className="label">Number of Batches</label>
                <input
                  type="number"
                  name="batches"
                  min="1"
                  value={formData.batches}
                  onChange={handleChange}
                  className="input w-full hover-lift"
                />
              </div>

              <div className="md:col-span-2">
                <label className="label">No. of Subjects</label>
                <input
                  type="number"
                  name="numSubjects"
                  value={formData.numSubjects}
                  onChange={(e) => {
                    const num = parseInt(e.target.value || "0", 10);
                    let updatedSubjects = [...formData.subjects];
                    if (num > updatedSubjects.length) {
                      for (let i = updatedSubjects.length; i < num; i++) {
                        updatedSubjects.push({ name: "", credits: "" });
                      }
                    } else {
                      updatedSubjects = updatedSubjects.slice(0, Math.max(num, 0));
                    }
                    setFormData((prev) => ({
                      ...prev,
                      numSubjects: isNaN(num) ? 0 : num,
                      subjects: updatedSubjects,
                    }));
                  }}
                  placeholder="Enter number of subjects"
                  className="input w-full hover-lift"
                />

                <div className="mt-4 space-y-2">
                  {formData.subjects?.map((subj, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 bg-ink-50 p-2 rounded-lg items-center border border-ink-100"
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
              className="input col-span-7 md:col-span-8 hover-lift"
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
                        className="input col-span-3 md:col-span-2 hover-lift"
                      />

                      <div className="col-span-2 md:col-span-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(idx)}
                          className="btn-ghost text-red-600 hover-lift"
                          title="Remove"
                          aria-label="Remove subject"
                        >
                          <TrashIcon />
                        </button>
                        {!subj.finalized && (
                          <button
                            type="button"
                            onClick={() => handleAddSubject(idx)}
                            className="btn-ghost text-brand-700 hover-lift"
                            title="Add"
                            aria-label="Add subject"
                          >
                            <PlusIcon />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="btn-primary mt-6 disabled:opacity-60 hover-lift"
                >
                  {loading ? "Generating..." : "Generate Timetable"}
                </button>

                {error && (
                  <div className="mt-4 card border-l-4 border-red-500 p-4 text-sm text-red-700">
                    <p>
                      <span className="font-medium">Error:</span> {error}
                    </p>
                  </div>
                )}

                {timetables.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3 reveal-y">
                    <button
                      onClick={downloadPDF}
                      className="btn bg-red-500 hover:bg-red-600 text-white hover-lift"
                    >
                      Download as PDF
                    </button>
                    <button
                      onClick={downloadExcel}
                      className="btn bg-brand-600 hover:bg-brand-700 text-white hover-lift"
                    >
                      Download as Excel
                    </button>
                  </div>
                )}

                <div className="mt-10">
                  <h3 className="text-lg font-semibold mb-3 text-ink-800 reveal-y">
                    Optimized Timetables
                  </h3>
                  {/* Batch Navigator */}
                  {timetables.length > 0 && (
                    <div className="card p-3 mb-4 sticky top-16 z-10 reveal-y">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-ink-700">Jump to batch</span>
                      </div>
                      <div className="flex gap-2 overflow-x-auto scrollbar pb-1">
                        {[...new Set(timetables.map((tt) => tt.batch))]
                          .sort((a, b) => ("" + a).localeCompare("" + b))
                          .map((b) => (
                            <button
                              key={b}
                              onClick={() => scrollToBatch(b)}
                              className="btn-ghost whitespace-nowrap hover-lift"
                              title={`Go to Batch ${b}`}
                            >
                              Batch {b}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-8">
                    {[...new Set(timetables.map((tt) => tt.batch))].map(
                      (batchNum) => {
                        const batchTimetables = timetables.filter(
                          (tt) => tt.batch === batchNum
                        );
                        const phases = [
                          ...new Set(batchTimetables.map((tt) => tt.phase)),
                        ].sort((a, b) => Number(a) - Number(b));
                        return (
                          <div
                            key={batchNum}
                            ref={getBatchRef(batchNum)}
                            id={`batch-${batchNum}`}
                            className="card p-8 w-full reveal-y"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-lg font-semibold">
                                Batch {batchNum}
                              </h4>
                              <div className="text-sm text-ink-500">
                                {phases.length} phases
                              </div>
                            </div>
                            {/* Phase Navigator */}
                            <div className="flex gap-2 overflow-x-auto scrollbar pb-2 mb-2">
                              {phases.map((p) => (
                                <button
                                  key={p}
                                  onClick={() => scrollToPhase(batchNum, p)}
                                  className="btn-ghost whitespace-nowrap hover-lift"
                                  title={`Go to Phase ${p}`}
                                >
                                  Phase {p}
                                </button>
                              ))}
                            </div>
                            {/* Vertical scroll: Phases */}
                            <div ref={getVScrollRef(batchNum)} className="max-h-[70vh] overflow-y-auto pr-2 scrollbar">
                              {phases.map((phaseNum) => {
                                const phaseTimetables = batchTimetables
                                  .filter((tt) => tt.phase === phaseNum)
                                  .sort(
                                    (a, b) => (a.option || 0) - (b.option || 0)
                                  );
                                return (
                                  <div key={phaseNum} ref={getPhaseItemRef(batchNum, phaseNum)} className="mb-6 phase-block reveal-y">
                                      <div className="flex items-center justify-between mb-2">
                                      <h5 className="text-base font-medium text-ink-700">
                                        Phase {phaseNum}
                                      </h5>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-ink-500">
                                          {phaseTimetables.length} options
                                        </span>
                                        <button
                                          type="button"
                                          className="btn-ghost text-xs px-2 py-1 hover-lift inline-flex items-center gap-1"
                                          onClick={() => handleNextOption(batchNum, phaseNum)}
                                          title="Next option"
                                        >
                                          <span>Next</span>
                                          <ChevronRightIcon />
                                        </button>
                                      </div>
                                    </div>
                                    {/* Horizontal scroll: Options */}
                                    {(() => {
                                      const phaseScrollRef = getHScrollRef(batchNum, phaseNum);
                                      return (
                                        <div
                                          ref={phaseScrollRef}
                                          onScroll={(e) => onHorizontalScroll(batchNum, phaseNum, e)}
                                          onMouseMove={onHScrollMouseMove}
                                          onMouseLeave={onHScrollMouseLeave}
                                          onClick={onHScrollClick}
                                          className="hscroll-interactive flex gap-5 overflow-x-auto pb-2 scrollbar"
                                        >
                                          {phaseTimetables.map((tt, ttIdx) => (
                                            <div
                                              key={ttIdx}
                                              onClick={(e) => { e.stopPropagation(); centerCardInView(phaseScrollRef.current, e.currentTarget); }}
                                                className="min-w-[40rem] card card-3d tt-card reveal-x p-2 border border-ink-100 select-none hover-lift"
                                              role="button"
                                              tabIndex={0}
                                              onMouseEnter={onCardMouseEnter}
                                              onMouseLeave={onCardMouseLeave}
                                            >
                                              <div className="font-semibold text-base mb-1 text-ink-800">
                                                Option {tt.option}
                                              </div>
                                              {(tt.sectionsData || []).map((section, sIdx) => (
                                                <div key={sIdx} className="mb-2 last:mb-0">
                                                  <div className="flex items-center justify-between mb-1">
                                                    <h6 className="font-medium text-sm">
                                                      {section.section}
                                                    </h6>
                                                  </div>
                                                  <div className="overflow-x-auto">
                                                    <table className="w-full text-center text-sm">
                                                      <thead className="bg-ink-50">
                                                        <tr>
                                                          <th className="px-3 py-2 border border-ink-200">Mon</th>
                                                          <th className="px-3 py-2 border border-ink-200">Tue</th>
                                                          <th className="px-3 py-2 border border-ink-200">Wed</th>
                                                          <th className="px-3 py-2 border border-ink-200">Thu</th>
                                                          <th className="px-3 py-2 border border-ink-200">Fri</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        {(section.data || []).map((row, rIdx) => (
                                                          <tr key={rIdx} className="odd:bg-white even:bg-ink-50">
                                                            {row.map((cell, cIdx) => (
                                                              <td
                                                                key={cIdx}
                                                                className={`px-3 py-2 border border-ink-100 ${cell ? getRandomColor(cell) : ""}`}
                                                              >
                                                                {cell || "-"}
                                                              </td>
                                                            ))}
                                                          </tr>
                                                        ))}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                    {/* Close phase container */}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
