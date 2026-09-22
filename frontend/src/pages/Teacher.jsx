import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  getTeacherPending,
  getTeacherAccepted,
  acceptRequest,
  rejectRequest,
  uploadPaper,
} from "../api/auth";
import {
  Button,
  Card,
  Badge,
  EmptyState,
  ErrorState,
  CardSkeleton,
} from "../components/ui";
import { useToast } from "../contexts/ToastContext";

export default function Teacher() {
  const toast = useToast();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pending, accepted] = await Promise.all([
        getTeacherPending(),
        getTeacherAccepted(),
      ]);
      setPendingRequests(pending || []);
      setAcceptedRequests(accepted || []);
    } catch (err) {
      console.error("Error fetching teacher requests:", err);
      setError("Failed to load your requests. Please refresh the page.");
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
      toast("error", null, "Accept failed");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectRequest(id);
      fetchRequests();
    } catch (e) {
      console.error(e);
      toast("error", null, "Reject failed");
    }
  };

  const handleUpload = async (id, file) => {
    if (!file) {
      toast("warning", null, "Choose file to upload");
      return;
    }
    setUploadingId(id);
    try {
      await uploadPaper(id, file);
      toast("success", null, "Uploaded");
      fetchRequests();
    } catch (e) {
      console.error(e);
      toast("error", null, "Upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  const RequestCard = ({ req, type }) => (
    <Card className="mb-4">
      <Card.Header>
        <div className="flex items-start justify-between gap-3">
          <h4 className="text-base font-semibold text-neutral-800">
            {req.subject}{" "}
            <span className="text-sm font-normal text-neutral-500">
              ({req.subject_code || req.s_code})
            </span>
          </h4>
          <Badge variant={type === "pending" ? "warning" : "success"}>
            {req.status || type}
          </Badge>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-neutral-500">Course:</span>{" "}
            <span className="font-medium text-neutral-700">{req.course}</span>
          </div>
          <div>
            <span className="text-neutral-500">Semester:</span>{" "}
            <span className="font-medium text-neutral-700">{req.semester}</span>
          </div>
          <div>
            <span className="text-neutral-500">Branch:</span>{" "}
            <span className="font-medium text-neutral-700">{req.branch}</span>
          </div>
          <div>
            <span className="text-neutral-500">Total Marks:</span>{" "}
            <span className="font-medium text-neutral-700">
              {req.total_marks}
            </span>
          </div>
          <div>
            <span className="text-neutral-500">Deadline:</span>{" "}
            <span className="font-medium text-neutral-700">
              {req.deadline || "—"}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-1 text-sm">
          <p>
            <span className="font-medium text-neutral-600">Syllabus: </span>
            {req.syllabus_url ? (
              <a
                href={req.syllabus_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 hover:underline"
              >
                View
              </a>
            ) : (
              <span className="text-neutral-400">Not uploaded</span>
            )}
          </p>
          <p>
            <span className="font-medium text-neutral-600">
              Question Pattern:{" "}
            </span>
            {req.q_pattern_url ? (
              <a
                href={req.q_pattern_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 hover:underline"
              >
                View
              </a>
            ) : (
              <span className="text-neutral-400">Not uploaded</span>
            )}
          </p>
        </div>
      </Card.Body>
      <Card.Footer>
        {type === "pending" && req.status === "Pending" && (
          <div className="flex gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => handleAccept(req.id)}
            >
              Accept
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleReject(req.id)}
            >
              Reject
            </Button>
          </div>
        )}
        {type === "accepted" && req.status === "Accepted" && (
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              aria-label="Upload exam paper"
              className="block w-full text-sm text-neutral-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              onChange={(e) => handleUpload(req.id, e.target.files[0])}
            />
            {uploadingId === req.id && (
              <span className="text-xs text-neutral-500">Uploading…</span>
            )}
          </div>
        )}
      </Card.Footer>
    </Card>
  );

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Pending Requests */}
        <section>
          <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-warning-500" />
            Pending Requests
          </h2>
          {loading ? (
            <CardSkeleton lines={3} />
          ) : error ? (
            <ErrorState
              title="Failed to load requests"
              description={error}
              retry="Retry pending requests"
              onRetry={fetchRequests}
            />
          ) : pendingRequests.length === 0 ? (
            <Card>
              <Card.Body>
                <EmptyState
                  title="No pending requests"
                  description="New exam-paper requests will appear here."
                />
              </Card.Body>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <RequestCard key={req.id} req={req} type="pending" />
              ))}
            </div>
          )}
        </section>

        {/* Accepted Requests */}
        <section>
          <h2 className="text-lg font-semibold text-neutral-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success-500" />
            Accepted / Uploaded
          </h2>
          {loading ? (
            <CardSkeleton lines={3} />
          ) : acceptedRequests.length === 0 ? (
            <Card>
              <Card.Body>
                <EmptyState
                  title="No accepted requests"
                  description="Accepted requests will appear here."
                />
              </Card.Body>
            </Card>
          ) : (
            <div className="space-y-3">
              {acceptedRequests.map((req) => (
                <RequestCard key={req.id} req={req} type="accepted" />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
