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
  { value: "I", label: "I" },
  { value: "II", label: "II" },
  { value: "III", label: "III" },
  { value: "IV", label: "IV" },
  { value: "V", label: "V" },
  { value: "VI", label: "VI" },
  { value: "VII", label: "VII" },
  { value: "VIII", label: "VIII" },
];

export const BRANCHES = [
  { value: "", label: "Select Branch" },
  { value: "ISE", label: "ISE" },
  { value: "CSE", label: "CSE" },
  { value: "IT", label: "IT" },
  { value: "ECE", label: "ECE" },
  { value: "EEE", label: "EEE" },
  { value: "MECH", label: "MECH" },
  { value: "BioTech", label: "BioTech" },
];

export const SUBJECTS = [
  { value: "", label: "Select Subject" },
  { value: "Internet of Things", label: "Internet of Things" },
  { value: "Parallel Computing", label: "Parallel Computing" },
  { value: "Cryptography", label: "Cryptography" },
  { value: "Big Data Analytics", label: "Big Data Analytics" },
  { value: "MACHINE LEARNING", label: "MACHINE LEARNING" },
  { value: "CLOUD COMPUTING", label: "CLOUD COMPUTING" },
];

export const ROLES = [
  { value: "teacher", label: "Teacher" },
  { value: "student", label: "Student" },
];

// COE filter panel uses a loose variant (placeholder "None", no "Select ..." prefix).
// Export a normalised map keyed by name so callers can pick the shape they need.
export const COE_SELECT_OPTIONS = {
  course: [{ value: "None", label: "Course" }, ...COURSES.slice(1)],
  semester: [{ value: "None", label: "Semester" }, ...SEMESTERS.slice(1)],
  branch: [{ value: "None", label: "Branch" }, ...BRANCHES.slice(1)],
  subject: [{ value: "None", label: "Subject" }, ...SUBJECTS.slice(1)],
};
