import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import { ArrowLeft } from "lucide-react";

function EventMailingQrPage() {

  const { eventId } = useParams();

  const [busy, setBusy] = useState(false);

  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState("");

  const [log, setLog] = useState([]);
  const [progress, setProgress] = useState({ total: 0, done: 0, remaining: 0 });

  const run = async () => {

    setBusy(true);

    setMsg("");

    setLog([]);
    setProgress({ total: 0, done: 0, remaining: 0 });

    try {

      const token = localStorage.getItem("token");
      const res = await fetch(`${API.defaults.baseURL}/events/${eventId}/mailing/generate-qr`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok || !res.body) throw new Error("qr_generation_failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          for (const line of part.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;

            const data = JSON.parse(jsonStr);
            if (data.type === "start") {
              setProgress({
                total: data.total || 0,
                done: 0,
                remaining: data.remaining || 0,
              });
            } else if (data.type === "progress") {
              setProgress({
                total: data.total || 0,
                done: data.done || 0,
                remaining: data.remaining || 0,
              });
              if (data.log) setLog((prev) => [...prev, data.log]);
            } else if (data.type === "done") {
              setMsg(`QR images generated: ${data.generated}`);
              setToast("QR generation completed.");
              setTimeout(() => setToast(""), 1800);
            }
          }
        }
      }

      // log streamed via SSE

      // message streamed via SSE

    } catch {

      setMsg("QR generation failed.");

    } finally {

      setBusy(false);

    }

  };

  return (

    <DashboardLayout>

      <div className="max-w-lg">

        <Link

          to={`/dashboard/event/${eventId}/mailing`}

          className="inline-flex items-center gap-2 text-sm text-slate-600 mb-6"

        >

          <ArrowLeft size={16} />

          Mailing hub

        </Link>

        <h1 className="text-2xl font-bold text-slate-900">Generate QR codes</h1>

        <p className="text-slate-600 mt-2 text-sm">

          Creates a QR per attendee encoding event and check-in code, uploads PNGs to

          storage, and sets the QR column used at check-in.

        </p>

        <button

          type="button"

          disabled={busy}

          onClick={run}

          className="mt-6 bg-violet-600 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"

        >

          {busy ? "Generating…" : "Generate QR for all attendees"}

        </button>

        {busy && progress.total > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-slate-700">
              Remaining:{" "}
              <span className="font-semibold">{progress.remaining}</span> / {progress.total}
            </p>
            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-300"
                style={{
                  width: `${progress.total ? Math.min(100, (progress.done / progress.total) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {msg && <p className="mt-4 text-sm text-slate-700">{msg}</p>}

        {log.length > 0 && (

          <div className="mt-4 bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono max-h-48 overflow-y-auto">

            {log.map((line, i) => (

              <div key={i}>{line}</div>

            ))}

          </div>

        )}
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-violet-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
            {toast}
          </div>
        )}

      </div>

    </DashboardLayout>

  );

}

export default EventMailingQrPage;
