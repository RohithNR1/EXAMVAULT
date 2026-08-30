import React, { useEffect, useState } from "react";
import {
  getTeacherPending,
  getTeacherAccepted,
  acceptRequest,
  rejectRequest,
  uploadPaper,
} from "../api/teacher_api";

const Teacher = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const pending = await getTeacherPending();
      const accepted = await getTeacherAccepted();
      setPendingRequests(pending);
      setAcceptedRequests(accepted);
    } catch (err) {
      console.error("Error fetching teacher requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (id) => {
    try {
      await acceptRequest(id);
      fetchRequests();
    } catch (e) {
      console.error(e);
      alert("Accept failed");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectRequest(id);
      fetchRequests();
    } catch (e) {
      console.error(e);
      alert("Reject failed");
    }
  };

  const handleUpload = async (id, file) => {
    if (!file) {
      alert("Choose file to upload");
      return;
    }
    try {
      await uploadPaper(id, file);
      alert("Uploaded");
      fetchRequests();
    } catch (e) {
      console.error(e);
      alert("Upload failed");
    }
  };

  const handleLogout = () => {
    // You can clear tokens/localStorage here
    localStorage.removeItem("token");
    window.location.href = "/login"; // redirect to login
  };

  const RequestCard = ({ req, type }) => (
    <div className="bg-white shadow rounded-xl p-5 border border-gray-200 mb-4">
      <h4 className="text-lg font-semibold text-gray-700 mb-2">
        {req.subject} ({req.subject_code || req.s_code})
      </h4>
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
        <p><span className="font-medium">Course:</span> {req.course}</p>
        <p><span className="font-medium">Semester:</span> {req.semester}</p>
        <p><span className="font-medium">Branch:</span> {req.branch}</p>
        <p><span className="font-medium">Total Marks:</span> {req.total_marks}</p>
        <p><span className="font-medium">Deadline:</span> {req.deadline}</p>
        <p><span className="font-medium">Status:</span> {req.status}</p>
      </div>

      <div className="mt-3 text-sm">
        <p>
          <span className="font-medium">Syllabus: </span>
          {req.syllabus_url ? (
            <a
              href={req.syllabus_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              📄 View
            </a>
          ) : (
            "Not uploaded"
          )}
        </p>
        <p>
          <span className="font-medium">Question Pattern: </span>
          {req.q_pattern_url ? (
            <a
              href={req.q_pattern_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              📄 View
            </a>
          ) : (
            "Not uploaded"
          )}
        </p>
      </div>

      {type === "pending" && req.status === "Pending" && (
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => handleAccept(req.id)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Accept
          </button>
          <button
            onClick={() => handleReject(req.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Reject
          </button>
        </div>
      )}

      {type === "accepted" && req.status === "Accepted" && (
        <div className="mt-4">
          <input
            type="file"
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4
                       file:rounded-lg file:border-0 file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={(e) => handleUpload(req.id, e.target.files[0])}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Top Navbar */}
      <nav className="bg-white shadow p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">EXAM-VAULT</h2>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Role: <span className="font-medium">Teacher</span></span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="p-6">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Requests */}
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">📌 Pending Requests</h3>
              {pendingRequests.length === 0 ? (
                <p className="text-gray-500">No pending requests.</p>
              ) : (
                pendingRequests.map((req) => (
                  <RequestCard key={req.id} req={req} type="pending" />
                ))
              )}
            </div>

            {/* Accepted Requests */}
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">✅ Accepted / Uploaded</h3>
              {acceptedRequests.length === 0 ? (
                <p className="text-gray-500">No accepted requests.</p>
              ) : (
                acceptedRequests.map((req) => (
                  <RequestCard key={req.id} req={req} type="accepted" />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teacher;
