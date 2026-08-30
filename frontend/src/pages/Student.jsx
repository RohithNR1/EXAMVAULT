import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";

export default function Student() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    // Placeholder for fetching student results
    // You can add API call here when backend endpoint is ready
    setLoading(false);
  }, []);

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">My Exam Results</h1>

          {loading ? (
            <div className="text-center text-gray-600">Loading...</div>
          ) : results.length === 0 ? (
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
                    <th className="px-6 py-3 text-left">Marks</th>
                    <th className="px-6 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={result.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3">{result.subject}</td>
                      <td className="px-6 py-3">{result.subject_code}</td>
                      <td className="px-6 py-3">{result.marks}</td>
                      <td className="px-6 py-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {result.status}
                        </span>
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
