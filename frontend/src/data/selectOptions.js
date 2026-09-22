/**
 * Shared form-select metadata.
 *
 * Centralises the hard-coded option lists used across Register and COE so
 * there is a single source of truth and we do not risk diverging copies.
 */

export const COURSES = [
  { value: "", label: "Select Course" },
  { value: "B.E.", label: "B.E." },
  { value: "M.E.", label: "M.E." },
];

export const SEMESTERS = [
  { value: "", label: "Select Semester" },
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
].map((s) => ({ value: s, label: String(s) }));

export const BRANCHES = [
  { value: "", label: "Select Branch" },
  "CSE",
  "IT",
  "ECE",
  "EEE",
  "MECH",
  "BioTech",
].map((b) => ({ value: b, label: b }));

export const SUBJECTS = [
  { value: "", label: "Select Subject" },
  "Internet of Things",
  "Parallel Computing",
  "Cryptography",
  "Big Data Analytics",
  "MACHINE LEARNING",
  "CLOUD COMPUTING",
];

export const ROLES = [
  { value: "teacher", label: "Teacher" },
  { value: "coe", label: "COE" },
  { value: "student", label: "Student" },
  { value: "superintendent", label: "Superintendent" },
];

// COE filter panel uses a loose variant (placeholder "None", no "Select ..." prefix).
// Export a normalised map keyed by name so callers can pick the shape they need.
export const COE_SELECT_OPTIONS = {
  course: [{ value: "None", label: "Course" }, ...COURSES.slice(1)],
  semester: [{ value: "None", label: "Semester" }, ...SEMESTERS.slice(1)],
  branch: [{ value: "None", label: "Branch" }, ...BRANCHES.slice(1)],
  subject: [{ value: "None", label: "Subject" }, ...SUBJECTS.slice(1)],
};
