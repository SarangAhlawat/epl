import { useEffect, useState } from "react";
import API from "../services/api";
import { Database, Mail, HardDrive, RefreshCw } from "lucide-react";

const roleIcon = {
  database: Database,
  mailing: Mail,
  storage: HardDrive,
};

function statusStyles(status) {
  const s = String(status || "").toLowerCase();
  if (s === "connected" || s === "configured")
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (s === "not_configured") return "bg-amber-50 text-amber-900 border-amber-200";
  return "bg-rose-50 text-rose-800 border-rose-200";
}

function ServicesStatus() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = () => {
    setErr("");
    setLoading(true);
    API.get("/health/services")
      .then((res) => {
        setItems(Array.isArray(res.data?.services) ? res.data.services : []);
      })
      .catch(() => setErr("Could not reach backend health endpoint."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    API.get("/health/services")
      .then((res) => {
        setItems(Array.isArray(res.data?.services) ? res.data.services : []);
        setErr("");
      })
      .catch(() => setErr("Could not reach backend health endpoint."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Backend services</h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Mailing, database, and storage status for this environment.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 w-full sm:w-auto"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}

      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(loading && items.length === 0 ? [1, 2, 3] : items).map((svc, i) => {
          if (loading && items.length === 0) {
            return (
              <li
                key={i}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4 animate-pulse h-28"
              />
            );
          }
          const Icon = roleIcon[svc.role] || HardDrive;
          return (
            <li
              key={svc.id}
              className={`rounded-xl border p-4 ${statusStyles(svc.status)}`}
            >
              <div className="flex items-start gap-3">
                <span className="rounded-lg bg-white/80 p-2 border border-black/5">
                  <Icon size={20} className="opacity-80" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                    {svc.role}
                  </p>
                  <p className="font-semibold text-slate-900 mt-0.5">{svc.name}</p>
                  <p className="text-xs font-mono mt-1 capitalize">{svc.status}</p>
                  <p className="text-xs mt-1 opacity-90 line-clamp-2">{svc.detail}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default ServicesStatus;
