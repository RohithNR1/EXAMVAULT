import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import { listFinalPapers, getDecryptInfo } from "../api/auth";

export default function Superintendent() {
  const role = localStorage.getItem("role");
  const [papers, setPapers] = useState([]);

  const load = async () => {
    const { data } = await listFinalPapers();
    setPapers(data);
  };
  useEffect(()=>{ load(); }, []);

  const info = async (id) => {
    const { data } = await getDecryptInfo(id);
    alert(`Subject: ${data.s_code}\nURL: ${data.paper_url || "N/A"}`);
  };

  const onLogout = ()=>{ localStorage.clear(); window.location.href="/login"; }

  return (
    <div>
      <NavBar role={role} onLogout={onLogout} />
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">Final Papers</h2>
        <div className="space-y-3">
          {papers.map(p => (
            <div key={p.id} className="border p-3 rounded">
              <div className="text-sm">{p.s_code} — {p.subject}</div>
              {p.paper && <a className="text-blue-600" href={p.paper} target="_blank" rel="noreferrer">Download PDF</a>}
              <button className="ml-3 px-3 py-1 bg-black text-white rounded" onClick={()=>info(p.id)}>Info</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
