import React from "react";

const IconBase = ({ size = 20, className = "", children, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const CheckCircleIcon = ({ size = 18, className = "" }) => (
  <IconBase size={size} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12l3 3 5-5" />
  </IconBase>
);

export const XCircleIcon = ({ size = 18, className = "" }) => (
  <IconBase size={size} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </IconBase>
);

export const TrashIcon = ({ size = 18, className = "" }) => (
  <IconBase size={size} className={className}>
    <path d="M3 6h18" />
    <path d="M8 6l1-2h6l1 2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </IconBase>
);

export const PlusIcon = ({ size = 18, className = "" }) => (
  <IconBase size={size} className={className}>
    <path d="M12 5v14M5 12h14" />
  </IconBase>
);

export const ChevronRightIcon = ({ size = 16, className = "" }) => (
  <IconBase size={size} className={className}>
    <path d="M9 6l6 6-6 6" />
  </IconBase>
);

export const LayoutDashboardIcon = ({ size = 18, className = "" }) => (
  <IconBase size={size} className={className}>
    <rect x="3" y="3" width="8" height="8" rx="2" />
    <rect x="13" y="3" width="8" height="5" rx="2" />
    <rect x="13" y="10" width="8" height="11" rx="2" />
    <rect x="3" y="13" width="8" height="8" rx="2" />
  </IconBase>
);

export const CalendarIcon = ({ size = 18, className = "" }) => (
  <IconBase size={size} className={className}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 11h18" />
  </IconBase>
);

export const BuildingIcon = ({ size = 18, className = "" }) => (
  <IconBase size={size} className={className}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 7h2M12 7h2M16 7h2M8 11h2M12 11h2M16 11h2M8 15h2M12 15h2M16 15h2" />
    <path d="M4 19h16M10 21v-2M14 21v-2" />
  </IconBase>
);

export const CogIcon = ({ size = 18, className = "" }) => (
  <IconBase size={size} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.07a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.07a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.02 3.4l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.07a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .63.37 1.21.95 1.47.17.08.35.13.55.13H21a2 2 0 1 1 0 4h-.07a1.65 1.65 0 0 0-1.51 1Z" />
  </IconBase>
);
