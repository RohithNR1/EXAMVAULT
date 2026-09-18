import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { listFinalPapers, getDecryptInfo, getAuditLog } from "../api/auth";

export default function Superintendent() {
  const role = localStorage.getItem("role");
  const [papers, setPapers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logFilter, setLogFilter] = useState({ action: "", s_code: "", start: "", end: "" });
  const [logMeta, setLogMeta] = useState({ count: 0, total_pages: 1 });
  const [loading, setLoading] = useState(false);

  const loadPapers = async () => {
    const { data } = await listFinalPapers();
    setPapers(data);
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

  const info = async (id) => {
    const { data } = await getDecryptInfo(id);
    alert(`Subject: ${data.s_code}\nURL: ${data.paper_url || "N/A"}`);
  };

  const onLogout = () => { localStorage.clear(); window.location.href = "/login"; };

  return (
    <div>
      <NavBar role={role} onLogout={onLogout} />
      <div className="p-6 space-y-8">

        {/* Final Papers Section */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Final Papers</h2>
          <div className="space-y-3">
            {papers.map(p => (
              <div key={p.id} className="border p-3 rounded">
                <div className="text-sm">{p.s_code} — {p.subject}</div>
                {p.paper && <a className="text-blue-600" href={p.paper} target="_blank" rel="noreferrer">Download PDF</a>}
                <button className="ml-3 px-3 py-1 bg-black text-white rounded" onClick={() => info(p.id)}>Info</button>
              </div>
            ))}
            {papers.length === 0 && <p className="text-gray-500 text-sm">No final papers yet.</p>}
          </div>
        </section>

        {/* Audit Log Section */}
        <section className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-3">Audit Log</h2>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Action</label>
              <input
                className="border rounded px-2 py-1 text-sm w-40"
                placeholder="e.g. paper.uploaded"
                value={logFilter.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">S-Code</label>
              <input
                className="border rounded px-2 py-1 text-sm w-32"
                placeholder="e.g. 15CS51"
                value={logFilter.s_code}
                onChange={(e) => handleFilterChange("s_code", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={logFilter.start}
                onChange={(e) => handleFilterChange("start", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                className="border rounded px-2 py-1 text-sm"
                value={logFilter.end}
                onChange={(e) => handleFilterChange("end", e.target.value)}
              />
            </div>
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              onClick={applyFilters}
            >
              Filter
            </button>
            <button
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              onClick={() => { setLogFilter({ action: "", s_code: "", start: "", end: "" }); loadLogs(1); }}
            >
              Reset
            </button>
          </div>

          {/* Total count */}
          <p className="text-xs text-gray-500 mb-2">
            Showing {logs.length} of {logMeta.count} records
            {logMeta.total_pages > 1 && ` (page ${logMeta.page} of ${logMeta.total_pages})`}
          </p>

          {/* Loading state */}
          {loading && <p className="text-sm text-gray-500">Loading…</p>}

          {/* Table */}
          {!loading && logs.length > 0 && (
            <div className="overflow-x-auto border rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Timestamp</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Actor</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Role</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Action</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Paper ID</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">S-Code</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{log.actor_username}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          log.actor_role === "superintendent" ? "bg-purple-100 text-purple-700" :
                          log.actor_role === "teacher" ? "bg-blue-100 text-blue-700" :
                          log.actor_role === "coe" ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {log.actor_role}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-700">{log.action}</td>
                      <td className="px-3 py-2 text-center">{log.paper_id ?? "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs">{log.s_code ?? "—"}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          log.severity === "error" ? "bg-red-100 text-red-700" :
                          log.severity === "warn" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && logs.length === 0 && (
            <p className="text-gray-500 text-sm">No audit logs found.</p>
          )}

          {/* Pagination */}
          {!loading && logMeta.total_pages > 1 && (
            <div className="flex gap-2 mt-3">
              <button
                disabled={logMeta.page <= 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50"
                onClick={() => { loadLogs(logMeta.page - 1); }}
              >
                Prev
              </button>
              <span className="px-3 py-1 text-sm text-gray-600 self-center">
                {logMeta.page} / {logMeta.total_pages}
              </span>
              <button
                disabled={logMeta.page >= logMeta.total_pages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-gray-50"
                onClick={() => { loadLogs(logMeta.page + 1); }}
              >
                Next
              </button>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
