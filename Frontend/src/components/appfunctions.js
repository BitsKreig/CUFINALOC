// appFunctions.js
// Modular reusable functions for timetable app

import React from "react";

// ------------------------------
// Subject Management
// ------------------------------

export const handleSubjectChange = (subjectInput, setSubjectInput, field, value) => {
  setSubjectInput({ ...subjectInput, [field]: value });
};

export const handleAddSubject = (subjectInput, subjects, setSubjects, setSubjectInput) => {
  // Validation: ensure both name & credits are entered
  if (!subjectInput.name.trim() || !subjectInput.credits.trim()) {
    alert("Please fill both Subject Name and Credits before adding.");
    return;
  }

  // Add new subject to list
  setSubjects([...subjects, { name: subjectInput.name, credits: subjectInput.credits }]);

  // Reset input fields
  setSubjectInput({ name: "", credits: "" });
};

export const handleRemoveSubject = (subjects, setSubjects, index) => {
  const updatedSubjects = subjects.filter((_, i) => i !== index);
  setSubjects(updatedSubjects);
};

// ------------------------------
// Batch & Input Handling
// ------------------------------

export const handleBatchChange = (event, setBatchCount) => {
  const num = parseInt(event.target.value) || 1;
  setBatchCount(num);
};

export const handleInputChange = (setter) => (event) => {
  setter(event.target.value);
};

// ------------------------------
// Timetable Generation
// ------------------------------

export const handleGenerateTimetable = (
  subjects,
  batchCount,
  department,
  semester,
  navigate
) => {
  // Validation checks
  if (!department || !semester) {
    alert("Please select department and semester.");
    return;
  }

  if (!subjects.length) {
    alert("Please add at least one subject before generating timetable.");
    return;
  }

  const timetableData = {
    subjects,
    batchCount,
    department,
    semester,
  };

  // Store locally for timetable page
  localStorage.setItem("timetableData", JSON.stringify(timetableData));

  // Navigate to timetable page
  navigate("/timetable");
};

// ------------------------------
// Download Timetable (optional)
// ------------------------------

export const handleDownload = (timetableData) => {
  const blob = new Blob([JSON.stringify(timetableData, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "timetable.json";
  link.click();
  URL.revokeObjectURL(link.href);
};

// ------------------------------
// Scroll / Section Navigation
// ------------------------------

export const scrollToSection = (ref) => {
  if (ref?.current) {
    ref.current.scrollIntoView({ behavior: "smooth" });
  }
};

// ------------------------------
// Ref Helpers for Timetable Page
// ------------------------------

export const getBatchRef = (batchRefs, index) => {
  if (!batchRefs[index]) batchRefs[index] = React.createRef();
  return batchRefs[index];
};

export const getVScrollRef = (refArray, index) => {
  if (!refArray[index]) refArray[index] = React.createRef();
  return refArray[index];
};

export const getPhaseItemRef = (phaseRefs, phaseIndex) => {
  if (!phaseRefs[phaseIndex]) phaseRefs[phaseIndex] = React.createRef();
  return phaseRefs[phaseIndex];
};

export const getHScrollRef = (refArray, index) => {
  if (!refArray[index]) refArray[index] = React.createRef();
  return refArray[index];
};

export const scrollToBatch = (batchRefs, batchIndex) => {
  const ref = batchRefs[batchIndex];
  if (ref?.current) {
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

export const scrollToPhase = (phaseRefs, phaseIndex) => {
  const ref = phaseRefs[phaseIndex];
  if (ref?.current) {
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

export const onHorizontalScroll = (scrollContainer, setScrollPosition) => {
  if (!scrollContainer) return;
  scrollContainer.addEventListener("scroll", () => {
    setScrollPosition(scrollContainer.scrollLeft);
  });
};

// ------------------------------
// Center Card Smoothly
// ------------------------------

export const centerCardInView = (element) => {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const absoluteTop = rect.top + window.pageYOffset;
  const middle = absoluteTop - window.innerHeight / 2 + rect.height / 2;
  window.scrollTo({
    top: middle,
    behavior: "smooth",
  });
};
