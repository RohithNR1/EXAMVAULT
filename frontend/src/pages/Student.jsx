import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import { getStudentMe, getStudentFinalPapers, downloadPaper, verifyPaper } from "../api/auth";

export default function Student() {
  const [profile, setProfile] = useState(null);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verificationResults, setVerificationResults] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const [{ data: user }, { data: list }] = await Promise.all([
          getStudentMe(),
          getStudentFinalPapers(),
        ]);
        setProfile(user);
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

  const onLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <>
      <NavBar role={profile?.role} onLogout={onLogout} />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">My Exam Results</h1>

          {loading ? (
            <div className="text-center text-gray-600">Loading...</div>
          ) : papers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600">No exam results available yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-purple-600 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left">Subject</th>
                    <th className="px-6 py-3 text-left">Subject Code</th>
                    <th className="px-6 py-3 text-left">Course</th>
                    <th className="px-6 py-3 text-left">Semester</th>
                    <th className="px-6 py-3 text-left">Branch</th>
                    <th className="px-6 py-3 text-left">Access Window</th>
                    <th className="px-6 py-3 text-left">Paper</th>
                  </tr>
                </thead>
                <tbody>
                  {papers.map((paper) => (
                    <tr key={paper.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3">{paper.subject}</td>
                      <td className="px-6 py-3">{paper.s_code}</td>
                      <td className="px-6 py-3">{paper.course}</td>
                      <td className="px-6 py-3">{paper.semester}</td>
                      <td className="px-6 py-3">{paper.branch}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {paper.access_start
                          ? new Date(paper.access_start).toLocaleString()
                          : "—"}{" "}
                        →{" "}
                        {paper.access_end
                          ? new Date(paper.access_end).toLocaleString()
                          : "Open-ended"}
                      </td>
                      <td className="px-6 py-3">
                        {paper.encrypted_cid ? (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleDownload(paper.id, paper.s_code)}
                              disabled={downloadingId === paper.id}
                              className="text-blue-600 hover:underline disabled:text-gray-400 text-sm"
                            >
                              {downloadingId === paper.id ? "Downloading..." : "Download PDF"}
                            </button>
                            <button
                              onClick={() => handleVerify(paper.id, paper.s_code)}
                              disabled={verifyingId === paper.id}
                              className="text-purple-600 hover:underline disabled:text-gray-400 text-sm"
                            >
                              {verifyingId === paper.id ? "Verifying..." : "Verify on Blockchain"}
                            </button>
                          </div>
                        ) : (
                          paper.paper ? (
                            <a
                              href={paper.paper}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Download PDF
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {verificationResults[paper.id] ? (
                          <div className="text-xs">
                            {verificationResults[paper.id].verified ? (
                              <div className="text-green-600 font-medium">✓ Verified on-chain</div>
                            ) : (
                              <div className="text-red-600 font-medium">⚠ {verificationResults[paper.id].message}</div>
                            )}
                            {!verificationResults[paper.id].tx_hash && verificationResults[paper.id].timestamp && (
                              <div className="text-gray-400 mt-1">
                                {new Date(verificationResults[paper.id].timestamp * 1000).toLocaleString()}
                              </div>
                            )}
                            {verificationResults[paper.id].tx_hash && (
                              <div className="text-gray-400 mt-1 truncate" title={verificationResults[paper.id].tx_hash}>
                                TX: {verificationResults[paper.id].tx_hash.slice(0, 10)}...
                              </div>
                            )}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
