import client from "./client";

export const login = (username, password) =>
  client.post("login/", { username, password });

export const register = (payload) =>
  client.post("register/", payload);

export const getSubjectCodes = () =>
  client.get("subject-codes/");

// Teacher
export const acceptRequest = (id) =>
  client.post(`teacher/requests/${id}/accept/`);

export const uploadPaper = (id, file) => {
  const form = new FormData();
  form.append("paper", file);
  return client.post(`teacher/requests/${id}/upload/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getTeacherFinalPapers = () =>
  client.get("teacher/final-papers/");

// COE - endpoints used in COE.jsx
export const coeGetTeachers = (payload) =>
  client.post("coe/teachers/", payload);

export const coeCreateRequest = (formData) =>
  client.post("coe/requests/add/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const coeListRequests = () => client.get("coe/requests/");

export const coeGetCandidates = (s_code) =>
  client.get(`coe/candidates/?s_code=${encodeURIComponent(s_code)}`);

export const coeFinalize = (id) =>
  client.post(`coe/requests/${id}/finalize/`);

// Superintendent
export const listFinalPapers = () =>
  client.get("sup/final-papers/");

// Scrutiny API endpoints
export const scrutinyGetResults = () =>
  client.get("scrutiny/results/");

export const scrutinyGetSummary = () =>
  client.get("scrutiny/summary/");

export const scrutinyGetDetail = (requestId) =>
  client.get(`scrutiny/detail/${requestId}/`);

export const scrutinySyncVTU = (payload) =>
  client.post("scrutiny/vtu-sync/", payload);

export const getDecryptInfo = (paper_id) =>
  client.get(`sup/final-papers/${paper_id}/decrypt-info/`);

// Student
export const getStudentMe = () =>
  client.get("student/me/");

export const getStudentFinalPapers = () =>
  client.get("student/final-papers/");

// Phase 4.1: server-side decrypted download (returns raw PDF bytes)
export const downloadPaper = (paperId) =>
  client.get(`student/final-papers/${paperId}/download/`, {
    responseType: "blob",
  });

// Phase 4.3: blockchain verification
export const verifyPaper = (paperId) =>
  client.get(`student/final-papers/${paperId}/verify/`);
