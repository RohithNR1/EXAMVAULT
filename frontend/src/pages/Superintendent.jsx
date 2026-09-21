import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { listFinalPapers, getDecryptInfo, getAuditLog } from "../api/auth";
import {
  Button,
  Card,
  Badge,
  EmptyState,
  ErrorState,
  CardSkeleton,
} from "../components/ui";

export default function Superintendent() {
  const [papers, setPapers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState({ action: "", s_code: "", start: "", end: "" });
  const [logMeta, setLogMeta] = useState({ count: 0, total_pages: 1, page: 1 });
  const [loading, setLoading] = useState(false);
  const [papersError, setPapersError] = useState(null);

  const loadPapers = async () => {
    try {
      setPapersError(null);
      const { data } = await listFinalPapers();
      setPapers(data || []);
    } catch (e) {
      console.error("Failed to load final papers", e);
      setPapersError("Failed to load final papers.");
      setPapers([]);
    }
  };

  const loadLogs = async (page = 1, filters = logFilter) => {
    setLoading(true);
    try {
      const params = { page, page_size: 20, ...filters };
      const qs = new URLSearchParams(params).toString();
      const { data } = await getAuditLog(qs ? "?" + qs : "");
      setLogs(data.results || []);
      setLogMeta({ count: data.count, total_pages: data.total_pages, page: data.page });
    } catch (e) {
      console.error("Failed to load audit logs", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPapers(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadLogs(1); }, []);

  const handleFilterChange = (field, value) => {
    setLogFilter(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    loadLogs(1);
  };

  const clearFilters = () => {
    setLogFilter({ action: "", s_code: "", start: "", end: "" });
    loadLogs(1);
  };

  const info = async (id) => {
    try {
      const { data } = await getDecryptInfo(id);
      alert(`Subject: ${data.s_code}\nURL: ${data.paper_url || "N/A"}`);
    } catch (e) {
      console.error("Failed to get decrypt info", e);
      alert("Failed to retrieve paper info.");
    }
  };

  const roleBadgeVariant = (role) => {
    switch (role) {
      case "superintendent": return "purple";
      case "teacher": return "primary";
      case "coe": return "success";
      default: return "neutral";
    }
  };

  const severityBadgeVariant = (severity) => {
    switch (severity) {
      case "error": return "danger";
      case "warn": return "warning";
      default: return "success";
    }
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-6xl">

        {/* Final Papers Section */}
        <section>
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-neutral-800">Final Papers</h2>
            </Card.Header>
            <Card.Body>
              {papersError ? (
                <ErrorState
                  title="Failed to load papers"
                  description={papersError}
                  retry="Retry paper list"
                  onRetry={loadPapers}
                />
              ) : papers.length === 0 ? (
                <EmptyState
                  title="No final papers yet"
                  description="Finalized exam papers will appear here."
                />
              ) : (
                <div className="space-y-2">
                  {papers.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 bg-surface px-4 py-3"
                    >
                      <div className="text-sm text-neutral-700">
                        <span className="font-mono font-semibold text-neutral-800">{p.s_code}</span>
                        <span className="ml-2 text-neutral-500">— {p.subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.paper && (
                          <a
                            href={p.paper}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:underline"
                          >
                            Download PDF
                          </a>
                        )}
                        <Button variant="outline" size="sm" onClick={() => info(p.id)}>
                          Info
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </section>

        {/* Audit Log Section */}
        <section>
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-neutral-800">Audit Log</h2>
            </Card.Header>
            <Card.Body>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Action</label>
                  <input
                    className="rounded-lg border-neutral-300 shadow-soft text-sm w-40 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    placeholder="e.g. paper.uploaded"
                    value={logFilter.action}
                    onChange={(e) => handleFilterChange("action", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">S-Code</label>
                  <input
                    className="rounded-lg border-neutral-300 shadow-soft text-sm w-32 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    placeholder="e.g. 15CS51"
                    value={logFilter.s_code}
                    onChange={(e) => handleFilterChange("s_code", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    className="rounded-lg border-neutral-300 shadow-soft text-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    value={logFilter.start}
                    onChange={(e) => handleFilterChange("start", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">End Date</label>
                  <input
                    type="date"
                    className="rounded-lg border-neutral-300 shadow-soft text-sm focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                    value={logFilter.end}
                    onChange={(e) => handleFilterChange("end", e.target.value)}
                  />
                </div>
                <Button variant="primary" size="sm" onClick={applyFilters}>Filter</Button>
                <Button variant="ghost" size="sm" onClick={clearFilters}>Reset</Button>
              </div>

              {/* Total count */}
              <p className="text-xs text-neutral-500 mb-3">
                Showing {logs.length} of {logMeta.count} records
                {logMeta.total_pages > 1 && ` (page ${logMeta.page} of ${logMeta.total_pages})`}
              </p>

              {/* Loading state */}
              {loading && <CardSkeleton lines={3} />}

              {/* Table */}
              {!loading && logs.length > 0 && (
                <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200">
                        <th className="text-left px-3 py-2 font-medium text-neutral-600 whitespace-nowrap" scope="col">Timestamp</th>
                        <th className="text-left px-3 py-2 font-medium text-neutral-600 whitespace-nowrap" scope="col">Actor</th>
                        <th className="text-left px-3 py-2 font-medium text-neutral-600" scope="col">Role</th>
                        <th className="text-left px-3 py-2 font-medium text-neutral-600 whitespace-nowrap" scope="col">Action</th>
                        <th className="text-left px-3 py-2 font-medium text-neutral-600 text-center" scope="col">Paper ID</th>
                        <th className="text-left px-3 py-2 font-medium text-neutral-600 whitespace-nowrap" scope="col">S-Code</th>
                        <th className="text-left px-3 py-2 font-medium text-neutral-600" scope="col">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                          <td className="px-3 py-2 text-neutral-500 whitespace-nowrap text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-neutral-700">{log.actor_username}</td>
                          <td className="px-3 py-2">
                            <Badge variant={roleBadgeVariant(log.actor_role)}>{log.actor_role}</Badge>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-neutral-700">{log.action}</td>
                          <td className="px-3 py-2 text-center text-neutral-500 text-xs">{log.paper_id ?? "—"}</td>
                          <td className="px-3 py-2 font-mono text-xs text-neutral-600">{log.s_code ?? "—"}</td>
                          <td className="px-3 py-2">
                            <Badge variant={severityBadgeVariant(log.severity)}>{log.severity}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && logs.length === 0 && (
                <EmptyState
                  title="No audit logs found"
                  description="Try adjusting your filters to find more results."
                />
              )}

              {/* Pagination */}
              {!loading && logMeta.total_pages > 1 && (
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logMeta.page <= 1}
                    onClick={() => { loadLogs(logMeta.page - 1); }}
                  >
                    Prev
                  </Button>
                  <span className="text-sm text-neutral-600 px-2">
                    {logMeta.page} / {logMeta.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={logMeta.page >= logMeta.total_pages}
                    onClick={() => { loadLogs(logMeta.page + 1); }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </section>

      </div>
    </Layout>
  );
}
