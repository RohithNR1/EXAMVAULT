import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getStudentMe, getStudentFinalPapers, downloadPaper, verifyPaper } from "../api/auth";
import {
  Button,
  Card,
  Badge,
  EmptyState,
  ErrorState,
  CardSkeleton,
} from "../components/ui";

export default function Student() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verificationResults, setVerificationResults] = useState({});
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setFetchError(null);
        const [{ data: user }, { data: list }] = await Promise.all([
          getStudentMe(),
          getStudentFinalPapers(),
        ]);
        setPapers(list || []);
        // Sync student profile fields into localStorage for access-window filtering
        if (user?.role === "student") {
          localStorage.setItem("course", user.course ?? "");
          localStorage.setItem("semester", user.semester ?? "");
          localStorage.setItem("branch", user.branch ?? "");
          localStorage.setItem("subject", user.subject ?? "");
        }
      } catch (err) {
        console.error("Failed to load student data:", err);
        setFetchError("Failed to load your exam results. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDownload = async (paperId, sCode) => {
    setDownloadingId(paperId);
    try {
      const { data } = await downloadPaper(paperId);
      const blob = new Blob([data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert(err.response?.data?.detail || "Failed to download paper");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleVerify = async (paperId, sCode) => {
    setVerifyingId(paperId);
    try {
      const { data } = await verifyPaper(paperId);
      setVerificationResults((prev) => ({ ...prev, [paperId]: data }));
    } catch (err) {
      console.error("Verification failed:", err);
      const msg = err.response?.data?.message || err.response?.data?.detail || "Verification failed";
      setVerificationResults((prev) => ({ ...prev, [paperId]: { verified: false, message: msg } }));
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-800 mb-6">My Exam Results</h1>

        {loading ? (
          <div className="space-y-4">
            <CardSkeleton lines={4} />
            <CardSkeleton lines={4} />
          </div>
        ) : fetchError ? (
          <ErrorState
            title="Failed to load results"
            description={fetchError}
            retry="Retry loading results"
            onRetry={() => window.location.reload()}
          />
        ) : papers.length === 0 ? (
          <Card>
            <Card.Body>
              <EmptyState
                title="No exam results available yet"
                description="Results will appear here once your exams are finalized."
              />
            </Card.Body>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-primary-600 text-white">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium" scope="col">Subject</th>
                    <th className="px-5 py-3 text-left font-medium" scope="col">Subject Code</th>
                    <th className="px-5 py-3 text-left font-medium" scope="col">Course</th>
                    <th className="px-5 py-3 text-left font-medium" scope="col">Semester</th>
                    <th className="px-5 py-3 text-left font-medium" scope="col">Branch</th>
                    <th className="px-5 py-3 text-left font-medium" scope="col">Access Window</th>
                    <th className="px-5 py-3 text-left font-medium" scope="col">Paper</th>
                    <th className="px-5 py-3 text-left font-medium" scope="col">Blockchain</th>
                  </tr>
                </thead>
                <tbody className="bg-surface">
                  {papers.map((paper) => (
                    <tr key={paper.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-neutral-800">{paper.subject}</td>
                      <td className="px-5 py-3 font-mono text-neutral-600">{paper.s_code}</td>
                      <td className="px-5 py-3 text-neutral-700">{paper.course}</td>
                      <td className="px-5 py-3 text-neutral-700">{paper.semester}</td>
                      <td className="px-5 py-3 text-neutral-700">{paper.branch}</td>
                      <td className="px-5 py-3 text-xs text-neutral-500">
                        {paper.access_start
                          ? new Date(paper.access_start).toLocaleString()
                          : "—"}{" "}
                        →{" "}
                        {paper.access_end
                          ? new Date(paper.access_end).toLocaleString()
                          : "Open-ended"}
                      </td>
                      <td className="px-5 py-3">
                        {paper.encrypted_cid ? (
                          <div className="flex flex-col gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              isLoading={downloadingId === paper.id}
                              onClick={() => handleDownload(paper.id, paper.s_code)}
                            >
                              {downloadingId === paper.id ? "Downloading..." : "Download PDF"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              isLoading={verifyingId === paper.id}
                              onClick={() => handleVerify(paper.id, paper.s_code)}
                            >
                              {verifyingId === paper.id ? "Verifying..." : "Verify on Blockchain"}
                            </Button>
                          </div>
                        ) : (
                          paper.paper ? (
                            <a
                              href={paper.paper}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-600 hover:underline"
                            >
                              Download PDF
                            </a>
                          ) : (
                            <span className="text-neutral-400 text-sm">N/A</span>
                          )
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {verificationResults[paper.id] ? (
                          <div className="text-xs space-y-0.5">
                            {verificationResults[paper.id].verified ? (
                              <Badge variant="success">✓ Verified on-chain</Badge>
                            ) : (
                              <Badge variant="danger">{verificationResults[paper.id].message}</Badge>
                            )}
                            {!verificationResults[paper.id].tx_hash && verificationResults[paper.id].timestamp && (
                              <div className="text-neutral-400 mt-1">
                                {new Date(verificationResults[paper.id].timestamp * 1000).toLocaleString()}
                              </div>
                            )}
                            {verificationResults[paper.id].tx_hash && (
                              <div className="text-neutral-400 mt-1 truncate max-w-[180px]" title={verificationResults[paper.id].tx_hash}>
                                TX: {verificationResults[paper.id].tx_hash.slice(0, 10)}…
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
}
