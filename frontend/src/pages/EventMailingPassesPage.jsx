import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import { ArrowLeft } from "lucide-react";

const DEFAULT_HTML = `<div style="font-family:system-ui;padding:24px;max-width:480px;">
  <h2 style="margin:0 0 8px;">Your pass</h2>
  <p><strong>Name:</strong> {{name}}</p>
  <p><strong>Email:</strong> {{email}}</p>
  <p><strong>Roll / ID:</strong> {{roll_number}}</p>
  <p><strong>Check-in code:</strong> {{unique_id}}</p>
  <p><strong>QR:</strong> {{qr_url}}</p>
</div>`;

function EventMailingPassesPage() {

  const { eventId } = useParams();

  const [mergeHtml, setMergeHtml] = useState(DEFAULT_HTML);

  const [file, setFile] = useState(null);

  const [log, setLog] = useState([]);
  const [progress, setProgress] = useState({ total: 0, done: 0, remaining: 0 });

  const [busy, setBusy] = useState(false);

  const [msg, setMsg] = useState("");
  const [toast, setToast] = useState("");

  const run = async () => {

    setBusy(true);

    setMsg("");

    setLog([]);
    setProgress({ total: 0, done: 0, remaining: 0 });

    try {

      const fd = new FormData();

      fd.append("merge_html", mergeHtml);

      if (file) fd.append("pass_template", file);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API.defaults.baseURL}/events/${eventId}/mailing/generate-passes`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      if (!res.ok || !res.body) throw new Error("passes_generation_failed");

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
              setMsg(`Generated ${data.generated} passes.`);
              setToast("Pass generation completed.");
              setTimeout(() => setToast(""), 1800);
            }
          }
        }
      }

        // `/events/${eventId}/mailing/generate-passes`,

        // fd,

        // { headers: { "Content-Type": "multipart/form-data" } }

      // );

      // setLog(res.data.log || []);

      // setMsg(`Generated ${res.data.generated} passes.`);

    } catch {

      setMsg("Generation failed. Check S3 configuration and try again.");

    } finally {

      setBusy(false);

    }

  };

  return (

    <DashboardLayout>

      <div className="max-w-3xl">

        <Link

          to={`/dashboard/event/${eventId}/mailing`}

          className="inline-flex items-center gap-2 text-sm text-slate-600 mb-6"

        >

          <ArrowLeft size={16} />

          Mailing hub

        </Link>

        <h1 className="text-2xl font-bold text-slate-900">Generate passes</h1>

        <p className="text-slate-600 mt-2 text-sm">

          Optional image/PDF template uploads to the event. HTML below is merged per

          attendee using{" "}

          <code className="bg-slate-100 px-1 rounded text-xs">

            {"{{name}} {{email}} {{roll_number}} {{unique_id}} {{qr_url}} {{pass_template_url}}"}

          </code>

          . Generated passes are stored as viewable image assets (SVG) per attendee.

        </p>

        <div className="mt-6 space-y-4">

          <label className="block text-sm font-medium text-slate-700">

            Pass template file (optional)

            <input

              type="file"

              className="mt-1 block w-full text-sm"

              onChange={(e) => setFile(e.target.files?.[0] || null)}

            />

          </label>

          <label className="block text-sm font-medium text-slate-700">

            Merge HTML

            <textarea

              className="mt-1 w-full border border-slate-200 rounded-xl p-3 font-mono text-sm min-h-[220px]"

              value={mergeHtml}

              onChange={(e) => setMergeHtml(e.target.value)}

            />

          </label>

          <button

            type="button"

            disabled={busy}

            onClick={run}

            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"

          >

            {busy ? "Working…" : "Generate & store passes"}

          </button>

          {busy && progress.total > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-slate-700">
                Remaining:{" "}
                <span className="font-semibold">{progress.remaining}</span> / {progress.total}
              </p>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{
                    width: `${progress.total ? Math.min(100, (progress.done / progress.total) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {msg && <p className="text-sm text-slate-700">{msg}</p>}

          {log.length > 0 && (

            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono max-h-48 overflow-y-auto">

              {log.map((line, i) => (

                <div key={i}>{line}</div>

              ))}

            </div>

          )}

        </div>
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
            {toast}
          </div>
        )}

      </div>

    </DashboardLayout>

  );

}

export default EventMailingPassesPage;
