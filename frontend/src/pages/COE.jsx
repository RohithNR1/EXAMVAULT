import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import ScrutinyDashboard from "../components/ScrutinyDashboard";
import {
  coeGetTeachers,
  coeCreateRequest,
  coeListRequests,
  coeGetCandidates,
  coeFinalize,
} from "../api/auth";
import {
  Button,
  Card,
  Badge,
  Modal,
  EmptyState,
  ErrorState,
  CardSkeleton,
} from "../components/ui";
import { useToast } from "../contexts/ToastContext";
import { COE_SELECT_OPTIONS } from "../data/selectOptions";

export default function COE() {
  const toast = useToast();
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
  const [activeTab, setActiveTab] = useState("requests");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      setError(null);
      const { data } = await coeListRequests();
      setRequests(data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleSubmitSearch = async () => {
    if ([course, semester, branch, subject].some((v) => !v || v === "None")) {
      toast("warning", null, "Select course, semester, branch, subject");
      return;
    }
    setTeachersLoading(true);
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
      toast("error", null, "Failed to fetch teachers");
    } finally {
      setTeachersLoading(false);
    }
  };

  const openSendRequestModal = (teacher) => {
    setTargetTeacher(teacher);
    setReqDeadline("");
    setReqTotalMarks(100);
    setSendModalOpen(true);
  };

  const handleConfirmRequest = async () => {
    if (!targetTeacher) return toast("warning", null, "No teacher selected");
    if (!scode || !reqDeadline) return toast("warning", null, "Set deadline");

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
      toast("success", null, "Request created successfully");
      setSendModalOpen(false);
      setTargetTeacher(null);
      await loadRequests();
      await handleSubmitSearch();
    } catch (err) {
      console.error(err);
      toast("error", null, "Failed to create request");
    }
  };

  const urlToFile = async (url) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const filename = url.split("/").pop().split("?")[0];
    return new File([blob], filename, { type: "application/pdf" });
  };

  const handleOpenFinalize = async () => {
    if (!scode) return toast("warning", null, "Submit subject first");
    try {
      const { data } = await coeGetCandidates(scode);
      setCandidatePapers(data || []);
      setSelectedCandidateId(null);
      setFinalizeModalOpen(true);
    } catch (err) {
      console.error(err);
      toast("error", null, "No uploaded papers found");
    }
  };

  const handleFinalizePaper = async () => {
    if (!selectedCandidateId) return toast("warning", null, "Select a paper");
    try {
      await coeFinalize(selectedCandidateId);
      toast("success", null, "Paper finalized successfully");
      setFinalizeModalOpen(false);
      setCandidatePapers([]);
      setSelectedCandidateId(null);
      await loadRequests();
      await handleSubmitSearch();
    } catch (err) {
      console.error(err);
      toast("error", null, "Finalize failed");
    }
  };

  const grouped = {};
  requests.forEach((r) => {
    if (!grouped[r.s_code]) grouped[r.s_code] = [];
    grouped[r.s_code].push(r);
  });

  const tabItems = [
    { key: "requests", label: "Request Management" },
    { key: "scrutiny", label: "Scrutiny Dashboard" },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-neutral-200 mb-6">
          <nav className="flex gap-1" aria-label="COE sections" role="tablist">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2.5 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              }`}
              role="tab"
              aria-selected={activeTab === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "requests" && (
        <div className="grid gap-6 md:grid-cols-2" role="tabpanel" id="tabpanel-requests" aria-labelledby="tab-requests">
          {/* Left Panel — Send Request */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-neutral-800">Send Request</h2>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <CardSkeleton lines={3} />
              ) : (
              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm text-neutral-600">Course</span>
                  <select
                    className="mt-1 block w-full rounded-lg border-neutral-300 shadow-soft focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-50 text-sm"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                  >
                    {COE_SELECT_OPTIONS.course.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm text-neutral-600">Semester</span>
                  <select
                    className="mt-1 block w-full rounded-lg border-neutral-300 shadow-soft focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-50 text-sm"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  >
                    {COE_SELECT_OPTIONS.semester.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm text-neutral-600">Branch</span>
                  <select
                    className="mt-1 block w-full rounded-lg border-neutral-300 shadow-soft focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-50 text-sm"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                  >
                    {COE_SELECT_OPTIONS.branch.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm text-neutral-600">Subject</span>
                  <select
                    className="mt-1 block w-full rounded-lg border-neutral-300 shadow-soft focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-50 text-sm"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    {COE_SELECT_OPTIONS.subject.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>

                <div className="flex gap-2 pt-1">
                  <Button variant="primary" size="sm" onClick={handleSubmitSearch} isLoading={teachersLoading}>
                    Submit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={uploadedRequestIds.length === 0}
                    onClick={() => uploadedRequestIds.length > 0 && handleOpenFinalize()}
                  >
                    Finalize
                  </Button>
                  <Button variant="ghost" size="sm" onClick={loadRequests}>
                    Refresh
                  </Button>
                </div>

                {scode && (
                  <div className="text-sm text-neutral-600">
                    Subject Code: <span className="font-semibold text-neutral-800">{scode}</span>
                  </div>
                )}

                <div className="pt-2">
                  <span className="text-sm font-medium text-neutral-700">Available Teachers</span>
                  {teachersLoading ? (
                    <CardSkeleton lines={3} />
                  ) : (
                    <>
                      {teachers.length === 0 && (
                        <p className="text-sm text-neutral-500 mt-1">No teachers available</p>
                      )}
                      <div className="space-y-2 mt-2">
                        {teachers.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5 bg-surface"
                          >
                            <div className="text-sm text-neutral-700">
                              {t.first_name} {t.last_name}{" "}
                              <span className="text-neutral-500">({t.username})</span>
                            </div>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => openSendRequestModal(t)}
                            >
                              Send Request
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              )}
            </Card.Body>
          </Card>

          {/* Right Panel — Request Status */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-neutral-800">Request Status</h2>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <CardSkeleton lines={3} />
              ) : error ? (
                <ErrorState
                  title="Failed to load requests"
                  description={error}
                  retry="Retry request list"
                  onRetry={loadRequests}
                />
              ) : Object.keys(grouped).length === 0 ? (
                <EmptyState
                  title="No requests yet"
                  description="Submit a subject to begin the request workflow."
                />
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                  {Object.keys(grouped).map((s_code) => (
                    <div key={s_code} className="rounded-lg border border-neutral-200 bg-surface p-3">
                      <div className="text-sm font-semibold text-neutral-800">{s_code}</div>
                      <div className="mt-2 space-y-1.5">
                        {grouped[s_code].map((r) => (
                          <div
                            key={r.id}
                            className="flex justify-between items-center rounded-lg bg-surface px-3 py-2 border border-neutral-100"
                          >
                            <div className="text-sm text-neutral-700 truncate max-w-[60%]">
                              {r.teacher_first_name} {r.teacher_last_name} ({r.tusername})
                            </div>
                            <Badge variant="neutral">{r.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      )}

      {activeTab === "scrutiny" && (
        <div role="tabpanel" id="tabpanel-scrutiny" aria-labelledby="tab-scrutiny">
          <ScrutinyDashboard />
        </div>
      )}

      {/* Send Request Modal — shared Modal primitive */}
      <Modal
        open={isSendModalOpen}
        onClose={() => setSendModalOpen(false)}
        title={`Send Request to ${targetTeacher?.first_name ?? ""} ${targetTeacher?.last_name ?? ""}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSendModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirmRequest}>Confirm Request</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="text-sm text-neutral-600">
            Subject Code: <span className="font-semibold text-neutral-800">{scode}</span>
          </div>

          <div>
            <span className="text-sm font-medium text-neutral-700">Syllabus:</span>
            {defaultSyllabusUrl ? (
              <a
                href={defaultSyllabusUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-1 text-sm text-primary-600 hover:underline"
              >
                Open Syllabus PDF
              </a>
            ) : (
              <p className="text-sm text-neutral-500 mt-1">No syllabus available</p>
            )}
          </div>

          <div>
            <span className="text-sm font-medium text-neutral-700">Question Pattern:</span>
            {defaultQPatternUrl ? (
              <a
                href={defaultQPatternUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-1 text-sm text-primary-600 hover:underline"
              >
                Open Question Pattern PDF
              </a>
            ) : (
              <p className="text-sm text-neutral-500 mt-1">No question pattern available</p>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Deadline:</span>
            <input
              type="date"
              className="mt-1 block w-full rounded-lg border-neutral-300 shadow-soft text-sm"
              value={reqDeadline}
              onChange={(e) => setReqDeadline(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-neutral-700">Total Marks:</span>
            <input
              type="number"
              className="mt-1 block w-full rounded-lg border-neutral-300 shadow-soft text-sm"
              value={reqTotalMarks}
              onChange={(e) => setReqTotalMarks(Number(e.target.value))}
            />
          </label>
        </div>
      </Modal>

      {/* Finalize Modal — shared Modal primitive */}
      <Modal
        open={isFinalizeModalOpen}
        onClose={() => setFinalizeModalOpen(false)}
        title="Select one paper to finalize"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFinalizeModalOpen(false)}>Cancel</Button>
            <Button
              variant="success"
              disabled={!selectedCandidateId}
              onClick={handleFinalizePaper}
            >
              Finalize Paper
            </Button>
          </>
        }
      >
        <div className="max-h-[360px] overflow-auto space-y-2 pr-1" role="radiogroup" aria-labelledby="finalize-modal-title">
          {candidatePapers.length === 0 ? (
            <p className="text-sm text-neutral-500">No uploaded papers</p>
          ) : (
            candidatePapers.map((mp) => (
              <div
                key={mp.id}
                className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                  selectedCandidateId === mp.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-neutral-200 bg-surface hover:bg-neutral-50"
                }`}
                onClick={() => setSelectedCandidateId(mp.id)}
                role="radio"
                aria-checked={selectedCandidateId === mp.id}
                tabIndex={0}
                aria-label={`Paper ${mp.paper_number}${mp.scrutiny ? `, score ${mp.scrutiny.score_percent}% (${mp.scrutiny.quality})` : ', no scrutiny results yet'}`}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedCandidateId(mp.id); }}
              >
                <input
                  type="radio"
                  name="candidate"
                  value={mp.id}
                  checked={selectedCandidateId === mp.id}
                  onChange={() => setSelectedCandidateId(mp.id)}
                  className="mt-1 accent-primary-600"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 space-y-1 text-sm">
                  <div className="font-semibold text-neutral-800">{mp.paper_number}</div>
                  {mp.scrutiny ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="info">
                        Score: <b>{mp.scrutiny.score_percent}%</b> ({mp.scrutiny.quality})
                      </Badge>
                      <Badge
                        variant={mp.scrutiny.plagiarism_percent > 30 ? "danger" : "success"}
                      >
                        Plagiarism: {mp.scrutiny.plagiarism_percent}%
                      </Badge>
                      <span className="text-xs text-neutral-500">
                        Scrutinized on{" "}
                        {mp.scrutiny.created_at
                          ? new Date(mp.scrutiny.created_at).toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-neutral-500 italic text-xs">
                      Scrutiny results not available yet.
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
      </div>
    </Layout>
  );
}
