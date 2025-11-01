import React, { useEffect, useState } from "react";
import useTheme, { ThemeProvider } from "../useTheme";
import {
  LayoutDashboardIcon,
  CalendarIcon,
  BuildingIcon,
  CogIcon,
} from "./Icons";

export default function SidebarHeader({
  // optional props from parent App — will fallback to internal state if not provided
  active: propActive,
  setActive: propSetActive,
  sidebarExpanded: propSidebarExpanded,
  setSidebarExpanded: propSetSidebarExpanded,
}) {
  // theme hook (same as original App.jsx used)
  const { theme, toggleTheme } = useTheme();

  // local active state if parent didn't provide one
  const [localActive, setLocalActive] = useState(propActive ?? "timetables");
  useEffect(() => {
    if (propActive !== undefined && propActive !== localActive) {
      setLocalActive(propActive);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propActive]);

  const active = propActive ?? localActive;
  const setActive = (v) => {
    if (propSetActive) propSetActive(v);
    else setLocalActive(v);
  };

  // local sidebarExpanded state if parent didn't provide one
  const [localSidebarExpanded, setLocalSidebarExpanded] = useState(
    propSidebarExpanded ?? false
  );
  useEffect(() => {
    if (
      propSidebarExpanded !== undefined &&
      propSidebarExpanded !== localSidebarExpanded
    ) {
      setLocalSidebarExpanded(propSidebarExpanded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propSidebarExpanded]);

  const sidebarExpanded = propSidebarExpanded ?? localSidebarExpanded;
  const setSidebar = (v) => {
    if (propSidebarExpanded !== undefined && propSidebarExpanded !== null) {
      // parent manages it
      if (propSetSidebarExpanded) propSetSidebarExpanded(v);
    } else {
      setLocalSidebarExpanded(v);
    }
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  const navItems = [
    { key: "dashboard", label: "Dashboard", Icon: LayoutDashboardIcon },
    { key: "timetables", label: "Timetables", Icon: CalendarIcon },
    { key: "classes", label: "Classes", Icon: BuildingIcon },
    { key: "settings", label: "Settings", Icon: CogIcon },
  ];

  return (
    <>
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
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">
                Class
              </span>
            </h1>
          </div>

        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`hidden md:block card h-fit md:sticky md:top-20 overflow-hidden transition-all duration-300 ${
          sidebarExpanded ? "w-64 p-4" : "w-16 p-2"
        }`}
        aria-label="Sidebar navigation"
        aria-expanded={sidebarExpanded}
      >
        <div
          className={`flex items-center ${
            sidebarExpanded ? "justify-between" : "justify-center"
          } mb-2`}
        >
          {sidebarExpanded && <div className="font-semibold text-ink-700">Menu</div>}
          <button
            type="button"
            className="btn-ghost text-lg"
            aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            title={sidebarExpanded ? "Collapse" : "Expand"}
            onClick={() => setSidebar((v) => !v)}
          >
            {sidebarExpanded ? "«" : "»"}
          </button>
        </div>

        <nav>
          <ul className="space-y-2">
            {navItems.map(({ key, label, Icon }) => {
              const isActive = active === key;
              return (
                <li key={key}>
                  <button
                    onClick={() => setActive(key)}
                    className={`w-full flex items-center gap-3 rounded-lg transition-colors px-3 py-2 ${
                      sidebarExpanded ? "justify-start" : "justify-center"
                    } ${
                      isActive
                        ? "bg-brand-50 text-brand-700 border border-brand-100"
                        : "hover:bg-ink-100"
                    }`}
                    title={label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="text-xl" aria-hidden />
                    {sidebarExpanded && <span className="whitespace-nowrap">{label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
