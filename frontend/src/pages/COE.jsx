import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import ScrutinyDashboard from "../components/ScrutinyDashboard";
import {
  coeGetTeachers,
  coeCreateRequest,
  coeListRequests,
  coeGetCandidates,
  coeFinalize,
} from "../api/auth";

export default function COE() {
  const role = localStorage.getItem("role");

  const [course, setCourse] = useState("None");
  const [semester, setSemester] = useState("None");
  const [branch, setBranch] = useState("None");
  const [subject, setSubject] = useState("None");

  const [teachers, setTeachers] = useState([]);
  const [scode, setScode] = useState("");
  const [uploadedRequestIds, setUploadedRequestIds] = useState([]);

  const [defaultSyllabusUrl, setDefaultSyllabusUrl] = useState(null);
  const [defaultQPatternUrl, setDefaultQPatternUrl] = useState(null);

  const [isSendModalOpen, setSendModalOpen] = useState(false);
  const [targetTeacher, setTargetTeacher] = useState(null);
  const [reqDeadline, setReqDeadline] = useState("");
  const [reqTotalMarks, setReqTotalMarks] = useState(100);

  const [isFinalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [candidatePapers, setCandidatePapers] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("requests"); // New state for tab management

  const loadRequests = async () => {
    try {
      const { data } = await coeListRequests();
      setRequests(data || []);
    } catch (err) {
      console.error(err);
      setRequests([]);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSubmitSearch = async () => {
    if ([course, semester, branch, subject].some((v) => !v || v === "None")) {
      alert("Select course, semester, branch, subject");
      return;
    }
    try {
      const payload = { course, semester, branch, subject };
      const { data } = await coeGetTeachers(payload);
      setTeachers(data.teachers || []);
      setScode(data.s_code || "");
      setUploadedRequestIds((data.uploaded_request_ids || []).map((x) => x.id));
      setDefaultSyllabusUrl(data.default_syllabus_url || null);
      setDefaultQPatternUrl(data.default_q_pattern_url || null);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch teachers");
    }
  };

  const openSendRequestModal = (teacher) => {
    setTargetTeacher(teacher);
    setReqDeadline("");
    setReqTotalMarks(100);
    setSendModalOpen(true);
  };

  const handleConfirmRequest = async () => {
    if (!targetTeacher) return alert("No teacher selected");
    if (!scode || !reqDeadline) return alert("Set deadline");

    try {
      const form = new FormData();
      form.append("s_code", scode);
      form.append("g_id", targetTeacher.id);
      form.append("deadline", reqDeadline);
      form.append("total_marks", reqTotalMarks);

      // Append files if URLs exist
      if (defaultSyllabusUrl) form.append("syllabus", await urlToFile(defaultSyllabusUrl));
      if (defaultQPatternUrl) form.append("q_pattern", await urlToFile(defaultQPatternUrl));

      await coeCreateRequest(form);
      alert("Request created successfully");
      setSendModalOpen(false);
      setTargetTeacher(null);
      await loadRequests();
      await handleSubmitSearch();
    } catch (err) {
      console.error(err);
      alert("Failed to create request");
    }
  };

  const urlToFile = async (url) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const filename = url.split("/").pop().split("?")[0];
    return new File([blob], filename, { type: "application/pdf" });
  };

  const handleOpenFinalize = async () => {
    if (!scode) return alert("Submit subject first");
    try {
      const { data } = await coeGetCandidates(scode);
      setCandidatePapers(data || []);
      setSelectedCandidateId(null);
      setFinalizeModalOpen(true);
    } catch (err) {
      console.error(err);
      alert("No uploaded papers found");
    }
  };

  const handleFinalizePaper = async () => {
    if (!selectedCandidateId) return alert("Select a paper");
    try {
      await coeFinalize(selectedCandidateId);
      alert("Paper finalized successfully");
      setFinalizeModalOpen(false);
      setCandidatePapers([]);
      setSelectedCandidateId(null);
      await loadRequests();
      await handleSubmitSearch();
    } catch (err) {
      console.error(err);
      alert("Finalize failed");
    }
  };

  const onLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const grouped = {};
  requests.forEach((r) => {
    if (!grouped[r.s_code]) grouped[r.s_code] = [];
    grouped[r.s_code].push(r);
  });

  return (
    <div>
      <NavBar role={role} onLogout={onLogout} />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6 pt-6">
          <button
            onClick={() => setActiveTab("requests")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "requests"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Request Management
          </button>
          <button
            onClick={() => setActiveTab("scrutiny")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "scrutiny"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Scrutiny Dashboard
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "requests" && (
        <div className="p-6 grid gap-8 md:grid-cols-2">
          {/* Left Panel */}
          <div className="border p-6 rounded shadow-sm">
            <h2 className="text-2xl font-semibold text-center mb-4">Send Request</h2>

            <div className="grid grid-cols-1 gap-3">
              <label className="text-sm">Course</label>
              <select className="border p-2" value={course} onChange={(e) => setCourse(e.target.value)}>
                <option>None</option><option>B.E.</option><option>M.E.</option>
              </select>

              <label className="text-sm">Semester</label>
              <select className="border p-2" value={semester} onChange={(e) => setSemester(e.target.value)}>
                <option>None</option><option>I</option><option>II</option><option>III</option><option>IV</option>
                <option>V</option><option>VI</option><option>VII</option><option>VIII</option>
              </select>

              <label className="text-sm">Branch</label>
              <select className="border p-2" value={branch} onChange={(e) => setBranch(e.target.value)}>
                <option>None</option><option>CSE</option><option>IT</option><option>ECE</option><option>EEE</option>
                <option>MECH</option><option>BioTech</option>
              </select>

              <label className="text-sm">Subject</label>
              <select className="border p-2" value={subject} onChange={(e) => setSubject(e.target.value)}>
                <option>None</option><option>Internet of Things</option><option>Parallel Computing</option>
                <option>Cryptography</option><option>Big Data Analytics</option><option>MACHINE LEARNING</option><option>CLOUD COMPUTING  </option>
              </select>

              <div className="mt-2 flex gap-3">
                <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSubmitSearch}>Submit</button>
                <button
                  className={`px-4 py-2 rounded ${uploadedRequestIds.length>0 ? "bg-indigo-600 text-white":"bg-gray-300 text-gray-600 cursor-not-allowed"}`}
                  onClick={() => uploadedRequestIds.length>0 && handleOpenFinalize()}
                >Finalize</button>
                <button className="px-4 py-2 bg-gray-700 text-white rounded" onClick={loadRequests}>Refresh</button>
              </div>

              {scode && <div className="text-sm mt-2">Subject Code: <b>{scode}</b></div>}

              <div className="mt-3">
                <label className="text-sm">Available Teachers</label>
                {teachers.length === 0 && <div className="text-sm text-gray-500 mt-2">No teachers available</div>}
                <div className="space-y-2 mt-2">
                  {teachers.map((t) => (
                    <div key={t.id} className="flex items-center justify-between border p-3 rounded">
                      <div>{t.first_name} {t.last_name} ({t.username})</div>
                      <div>
                        <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => openSendRequestModal(t)}>Send Request</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="p-4">
            <h2 className="text-2xl font-semibold text-center mb-4">Request Status</h2>
            <div className="space-y-3">
              {Object.keys(grouped).length===0 && <div className="text-sm text-gray-500">No requests yet</div>}
              {Object.keys(grouped).map((s_code) => (
                <div key={s_code} className="border p-4 rounded">
                  <div className="text-lg font-medium">{s_code}</div>
                  <div className="mt-2 space-y-2">
                    {grouped[s_code].map((r) => (
                      <div key={r.id} className="flex justify-between items-center border p-2 rounded">
                        <div>{r.teacher_first_name} {r.teacher_last_name} ({r.tusername})</div>
                        <div className="text-sm"><span className="px-3 py-1 rounded bg-gray-100">{r.status}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "scrutiny" && (
        <div className="p-6">
          <ScrutinyDashboard />
        </div>
      )}

      {/* Send Request Modal */}
      {isSendModalOpen && targetTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white w-[700px] max-w-[95%] rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Send Request to {targetTeacher.first_name} {targetTeacher.last_name}</h3>
              <button className="text-gray-600" onClick={()=>setSendModalOpen(false)}>✕</button>
            </div>

            <div className="space-y-3">
              <div>Subject Code: <b>{scode}</b></div>

              <div>
                <label className="text-sm">Syllabus:</label>
                {defaultSyllabusUrl 
                  ? <a href={defaultSyllabusUrl} target="_blank" className="text-blue-600 underline block mt-1">Open Syllabus PDF</a>
                  : <div className="text-sm text-gray-500">No syllabus available</div>
                }
              </div>

              <div>
                <label className="text-sm">Question Pattern:</label>
                {defaultQPatternUrl
                  ? <a href={defaultQPatternUrl} target="_blank" className="text-blue-600 underline block mt-1">Open Question Pattern PDF</a>
                  : <div className="text-sm text-gray-500">No question pattern available</div>
                }
              </div>

              <div>
                <label className="text-sm">Deadline:</label>
                <input type="date" className="border p-2" value={reqDeadline} onChange={(e)=>setReqDeadline(e.target.value)} />
              </div>

              <div>
                <label className="text-sm">Total Marks:</label>
                <input type="number" className="border p-2" value={reqTotalMarks} onChange={(e)=>setReqTotalMarks(e.target.value)} />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button className="px-4 py-2 border rounded" onClick={()=>setSendModalOpen(false)}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleConfirmRequest}>Confirm Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Finalize Modal */}
      {isFinalizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white w-[700px] max-w-[95%] rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Select one paper to finalize</h3>
              <button className="text-gray-600" onClick={()=>setFinalizeModalOpen(false)}>✕</button>
            </div>

            <div className="max-h-[300px] overflow-auto space-y-3">
              {candidatePapers.length===0 && <div className="text-sm text-gray-500">No uploaded papers</div>}
              {candidatePapers.map((mp) => (
                <div key={mp.id} className="flex items-start gap-3 border p-3 rounded">
                  <input type="radio" name="candidate" value={mp.id} checked={selectedCandidateId===mp.id} onChange={()=>setSelectedCandidateId(mp.id)} className="mt-1" />
                  <div className="flex-1 space-y-1 text-sm">
                    <div className="font-medium text-base">{mp.paper_number}</div>
                    {mp.scrutiny ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">
                          Score: <b>{mp.scrutiny.score_percent}%</b> ({mp.scrutiny.quality})
                        </span>
                        <span className={`px-2 py-1 rounded ${mp.scrutiny.plagiarism_percent > 30 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          Plagiarism: {mp.scrutiny.plagiarism_percent}%
                        </span>
                        <span className="text-xs text-gray-500">
                          Scrutinized on {mp.scrutiny.created_at ? new Date(mp.scrutiny.created_at).toLocaleString() : "N/A"}
                        </span>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">Scrutiny results not available yet.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button className="px-4 py-2 border rounded" onClick={()=>setFinalizeModalOpen(false)}>Cancel</button>
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleFinalizePaper}>Finalize Paper</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
