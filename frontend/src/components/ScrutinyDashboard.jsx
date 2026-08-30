import { useEffect, useState } from "react";
import { scrutinyGetResults, scrutinyGetSummary, scrutinySyncVTU } from "../api/auth";

export default function ScrutinyDashboard() {
  const [summary, setSummary] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [syncForm, setSyncForm] = useState({
    subject_code: "",
    syllabus_url: "",
    question_index_url: "",
  });
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  const loadScrutinyData = async () => {
    try {
      setLoading(true);
      const [summaryResponse, resultsResponse] = await Promise.all([
        scrutinyGetSummary(),
        scrutinyGetResults()
      ]);
      
      setSummary(summaryResponse.data);
      setResults(resultsResponse.data.results || []);
    } catch (error) {
      console.error("Error loading scrutiny data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScrutinyData();
  }, []);

  const handleSyncChange = (field, value) => {
    setSyncForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSyncSubmit = async (e) => {
    e.preventDefault();
    if (!syncForm.subject_code || !syncForm.syllabus_url) {
      setSyncMessage({ type: "error", text: "Subject code and syllabus URL are required." });
      return;
    }
    try {
      setSyncLoading(true);
      setSyncMessage(null);
      await scrutinySyncVTU(syncForm);
      setSyncMessage({
        type: "success",
        text: "VTU resources synced successfully. Refreshed defaults will be used in new requests.",
      });
      setSyncForm((prev) => ({
        subject_code: prev.subject_code,
        syllabus_url: "",
        question_index_url: "",
      }));
      await loadScrutinyData();
    } catch (error) {
      console.error("VTU sync failed:", error);
      setSyncMessage({
        type: "error",
        text: error.response?.data?.detail || "Failed to sync VTU resources. Check the URLs and try again.",
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const getQualityColor = (status) => {
    switch (status) {
      case "excellent": return "text-green-600 bg-green-100";
      case "good": return "text-blue-600 bg-blue-100";
      case "fair": return "text-yellow-600 bg-yellow-100";
      case "poor": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getScoreColor = (score) => {
    const numericScore = typeof score === "string" ? parseInt(score.replace("%", ""), 10) : Number(score);
    const numScore = Number.isNaN(numericScore) ? 0 : numericScore;
    if (numScore >= 80) return "text-green-600";
    if (numScore >= 60) return "text-blue-600";
    if (numScore >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const openDetailModal = (result) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  if (loading) {
    return (
      <div className="border p-6 rounded shadow-sm">
        <h2 className="text-2xl font-semibold text-center mb-4">Scrutiny Dashboard</h2>
        <div className="text-center">Loading scrutiny data...</div>
      </div>
    );
  }

  return (
    <div className="border p-6 rounded shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Scrutiny Dashboard</h2>
        <button 
          onClick={loadScrutinyData}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
        >
          Refresh
        </button>
      </div>

      {/* VTU Sync Panel */}
      <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold">VTU Resource Sync</h3>
            <p className="text-sm text-gray-600">
              Automatically download the official VTU syllabus and latest model question papers
              for a subject to power scrutiny and plagiarism checks.
            </p>
          </div>
        </div>
        <form onSubmit={handleSyncSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700">Subject Code</label>
            <input
              type="text"
              placeholder="e.g., BCS601"
              className="border rounded px-3 py-2"
              value={syncForm.subject_code}
              onChange={(e) => handleSyncChange("subject_code", e.target.value.toUpperCase())}
            />
          </div>
          <div className="flex flex-col md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Syllabus PDF URL</label>
            <input
              type="url"
              placeholder="https://vtu.ac.in/....pdf"
              className="border rounded px-3 py-2"
              value={syncForm.syllabus_url}
              onChange={(e) => handleSyncChange("syllabus_url", e.target.value)}
            />
          </div>
          <div className="flex flex-col md:col-span-3">
            <label className="text-sm font-medium text-gray-700">Model Question Paper Index URL (optional)</label>
            <input
              type="url"
              placeholder="https://vtu.ac.in/model-question-paper-b-e-b-tech-b-arch/"
              className="border rounded px-3 py-2"
              value={syncForm.question_index_url}
              onChange={(e) => handleSyncChange("question_index_url", e.target.value)}
            />
          </div>
          <div className="md:col-span-3 flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60"
              disabled={syncLoading}
            >
              {syncLoading ? "Syncing..." : "Sync VTU Resources"}
            </button>
            {syncMessage && (
              <span
                className={`text-sm ${
                  syncMessage.type === "success" ? "text-green-600" : "text-red-600"
                }`}
              >
                {syncMessage.text}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.total_papers}</div>
            <div className="text-sm text-gray-600">Total Papers</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {summary.average_score ?? 0}%
            </div>
            <div className="text-sm text-gray-600">Avg Score</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{summary.papers_needing_review}</div>
            <div className="text-sm text-gray-600">Need Review</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.plagiarism_issues}</div>
            <div className="text-sm text-gray-600">Plagiarism Issues</div>
          </div>
        </div>
      )}

      {/* Quality Distribution */}
      {summary && summary.quality_distribution && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Quality Distribution</h3>
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(summary.quality_distribution).map(([quality, count]) => (
              <div key={quality} className={`p-3 rounded-lg ${getQualityColor(quality)}`}>
                <div className="text-lg font-bold">{count}</div>
                <div className="text-sm capitalize">{quality}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-2 text-left">Subject Code</th>
              <th className="border border-gray-300 p-2 text-left">Teacher</th>
              <th className="border border-gray-300 p-2 text-left">Questions</th>
              <th className="border border-gray-300 p-2 text-left">Score</th>
              <th className="border border-gray-300 p-2 text-left">Quality</th>
              <th className="border border-gray-300 p-2 text-left">Date</th>
              <th className="border border-gray-300 p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan="7" className="border border-gray-300 p-4 text-center text-gray-500">
                  No scrutiny results available
                </td>
              </tr>
            ) : (
              results.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2">
                    {result.request_info?.subject_code || 'N/A'}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {result.request_info?.teacher_name || 'N/A'}
                  </td>
                  <td className="border border-gray-300 p-2">
                    {result.summary?.num_questions || 0}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <span className={`font-bold ${getScoreColor(result.overall_score_display)}`}>
                      {result.overall_score_display}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-2">
                    <span className={`px-2 py-1 rounded text-xs ${getQualityColor(result.quality_status)}`}>
                      {result.quality_status}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-2">
                    {new Date(result.created_at).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <button
                      onClick={() => openDetailModal(result)}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white w-[800px] max-w-[95%] rounded-lg shadow-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Scrutiny Details</h3>
              <button 
                className="text-gray-600 hover:text-gray-800"
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold">Subject Code:</label>
                  <div>{selectedResult.request_info?.subject_code || 'N/A'}</div>
                </div>
                <div>
                  <label className="font-semibold">Teacher:</label>
                  <div>{selectedResult.request_info?.teacher_name || 'N/A'}</div>
                </div>
                <div>
                  <label className="font-semibold">Total Questions:</label>
                  <div>{selectedResult.summary?.num_questions || 0}</div>
                </div>
                <div>
                  <label className="font-semibold">Overall Score:</label>
                  <div className={`font-bold ${getScoreColor(selectedResult.overall_score_display)}`}>
                    {selectedResult.overall_score_display}
                  </div>
                </div>
              </div>

              {/* Bloom's Taxonomy Distribution */}
              {selectedResult.summary?.bloom_distribution && (
                <div>
                  <label className="font-semibold">Bloom's Taxonomy Distribution:</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {Object.entries(selectedResult.summary.bloom_distribution).map(([level, score]) => (
                      <div key={level} className="bg-gray-100 p-2 rounded">
                        <div className="text-sm font-medium capitalize">{level}</div>
                        <div className="text-lg font-bold">{Math.round(score * 100)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Difficulty Distribution */}
              {selectedResult.summary?.difficulty_distribution && (
                <div>
                  <label className="font-semibold">Difficulty Distribution:</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {Object.entries(selectedResult.summary.difficulty_distribution).map(([level, count]) => (
                      <div key={level} className={`p-2 rounded ${getQualityColor(level)}`}>
                        <div className="text-sm font-medium capitalize">{level}</div>
                        <div className="text-lg font-bold">{Math.round(count * 100)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plagiarism Analysis */}
              {selectedResult.summary?.plagiarism_analysis && (
                <div>
                  <label className="font-semibold">Plagiarism Analysis:</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span>Plagiarism Score:</span>
                      <span className={`font-bold ${selectedResult.summary.plagiarism_analysis.plagiarism_score > 0.3 ? 'text-red-600' : 'text-green-600'}`}>
                        {Math.round(selectedResult.summary.plagiarism_analysis.plagiarism_score * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duplicate Questions:</span>
                      <span>{selectedResult.summary.plagiarism_analysis.duplicates?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Similar Questions:</span>
                      <span>{selectedResult.summary.plagiarism_analysis.similar_questions?.length || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedResult.summary?.recommendations && selectedResult.summary.recommendations.length > 0 && (
                <div>
                  <label className="font-semibold">Recommendations:</label>
                  <ul className="mt-2 space-y-1">
                    {selectedResult.summary.recommendations.map((rec, index) => (
                      <li key={index} className="text-sm text-gray-700">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* VTU Module Coverage */}
              {selectedResult.summary?.syllabus_alignment && (
                <div>
                  <label className="font-semibold">VTU Module Coverage:</label>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full border border-gray-200 text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 border border-gray-200 text-left">Module</th>
                          <th className="p-2 border border-gray-200 text-left">Coverage</th>
                          <th className="p-2 border border-gray-200 text-left">Matched Questions</th>
                          <th className="p-2 border border-gray-200 text-left">Tags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedResult.summary.syllabus_alignment.module_breakdown.map((module) => (
                          <tr key={module.module_number}>
                            <td className="p-2 border border-gray-200">
                              <div className="font-medium">{module.title}</div>
                            </td>
                            <td className={`p-2 border border-gray-200 ${getScoreColor(module.coverage * 100)}`}>
                              {Math.round((module.coverage || 0) * 100)}%
                            </td>
                            <td className="p-2 border border-gray-200">{module.matched_questions}</td>
                            <td className="p-2 border border-gray-200">
                              {module.contributing_tags.length === 0 ? (
                                <span className="text-gray-500">—</span>
                              ) : (
                                module.contributing_tags.map((tag) => (
                                  <span key={tag} className="mr-2 bg-gray-200 rounded px-2 py-1 inline-block">
                                    {tag}
                                  </span>
                                ))
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-sm text-gray-600 mt-2">
                      Average Module Coverage:{" "}
                      <span className={getScoreColor(selectedResult.summary.syllabus_alignment.average_module_coverage * 100)}>
                        {Math.round((selectedResult.summary.syllabus_alignment.average_module_coverage || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Question-Level Insights */}
              {selectedResult.summary?.questions && selectedResult.summary.questions.length > 0 && (
                <div>
                  <label className="font-semibold">Question-Level Insights:</label>
                  <div className="mt-3 space-y-3">
                    {selectedResult.summary.questions.map((question, index) => {
                      const bloomEntries = Object.entries(question.bloom || {});
                      const primaryBloom =
                        bloomEntries.length > 0
                          ? bloomEntries.reduce((best, current) =>
                              current[1] > best[1] ? current : best,
                            bloomEntries[0])[0]
                          : "N/A";
                      return (
                        <div key={index} className="border border-gray-200 rounded p-3">
                          <div className="flex justify-between items-start gap-3">
                            <div className="font-medium text-gray-800">Q{index + 1}</div>
                            <div className="text-xs uppercase tracking-wide bg-gray-200 rounded px-2 py-1">
                              {primaryBloom}
                            </div>
                            <div className={`text-sm font-semibold ${getScoreColor((question.difficulty?.score || 0) * 100)}`}>
                              {question.difficulty?.level || "N/A"}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">{question.text}</div>
                          {question.tags && question.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {question.tags.map((tag) => (
                                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedResult.summary?.tags && selectedResult.summary.tags.length > 0 && (
                <div>
                  <label className="font-semibold">Tags:</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedResult.summary.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-200 rounded text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

