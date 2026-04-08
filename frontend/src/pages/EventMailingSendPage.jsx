import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import { ArrowLeft } from "lucide-react";

const RESPONSIVE_TEMPLATE = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <style>
      body{margin:0;padding:0;background:#0b1220;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
      .wrap{max-width:640px;margin:0 auto;padding:24px}
      .card{background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb}
      .head{padding:18px 18px 0}
      .title{margin:0;font-size:20px;line-height:1.25;color:#0f172a}
      .muted{margin:8px 0 0;color:#475569;font-size:14px;line-height:1.5}
      .section{padding:18px}
      .row{display:flex;gap:16px;flex-wrap:wrap}
      .col{flex:1;min-width:240px}
      .pill{display:inline-block;background:#eef2ff;color:#3730a3;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:700}
      .code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#0b1220;color:#e2e8f0;border-radius:10px;padding:10px 12px;display:inline-block}
      .img{width:100%;height:auto;display:block;border-radius:14px;border:1px solid #e5e7eb}
      .qr{max-width:280px;margin:0 auto}
      .foot{padding:14px 18px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.4}
      @media (max-width:520px){
        .wrap{padding:14px}
        .title{font-size:18px}
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="head">
          <span class="pill">Event Pass</span>
          <h1 class="title">Hi {{name}}, your pass is ready</h1>
          <p class="muted">Show the QR below at the entry. Keep this email handy on mobile.</p>
        </div>

        <div class="section">
          <div class="row">
            <div class="col">
              <p class="muted" style="margin:0 0 8px">Check-in code</p>
              <div class="code">{{unique_id}}</div>
              <p class="muted" style="margin:10px 0 0">Email: {{email}}</p>
              <p class="muted" style="margin:6px 0 0">Roll / ID: {{roll_number}}</p>
            </div>
            <div class="col">
              <p class="muted" style="margin:0 0 8px">Scan QR</p>
              <div class="qr">
                <img class="img" src="{{qr_url}}" alt="QR code" />
              </div>
            </div>
          </div>
        </div>

        <div class="section" style="padding-top:0">
          <p class="muted" style="margin:0 0 10px">Your pass</p>
          <img class="img" src="{{pass_url}}" alt="Pass" />
        </div>

        <div class="foot">
          If images don’t load, open the pass link directly: {{pass_url}}
        </div>
      </div>
    </div>
  </body>
</html>`;

function EventMailingSendPage() {

  const { eventId } = useParams();

  const [tab, setTab] = useState("pass_mail");

  const [subject, setSubject] = useState("Your event pass");

  const [html, setHtml] = useState(

    "<p>Hi {{name}},</p><p>Thanks for registering. Your check-in code is <strong>{{unique_id}}</strong>.</p>"

  );

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState({ total: 0, done: 0, remaining: 0, sent: 0, failed: 0, skipped: 0, delivery: "" });
  const [liveLog, setLiveLog] = useState([]);

  const [campaigns, setCampaigns] = useState([]);
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpAppPassword, setSmtpAppPassword] = useState("");

  const loadCampaigns = useCallback(() => {

    API.get(`/events/${eventId}/mailing/campaigns`).then((res) => {

      setCampaigns(Array.isArray(res.data) ? res.data : []);

    });

  }, [eventId]);

  useEffect(() => {

    loadCampaigns();

  }, [loadCampaigns]);

  const send = async () => {

    setBusy(true);

    setResult(null);
    setLiveLog([]);
    setProgress({ total: 0, done: 0, remaining: 0, sent: 0, failed: 0, skipped: 0, delivery: "" });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API.defaults.baseURL}/events/${eventId}/mailing/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          campaign_type: tab,
          subject,
          html_body: html,
          attach_pass_link: false,
          smtp_host: smtpHost,
          smtp_port: Number(smtpPort || 587),
          smtp_user: smtpUser,
          smtp_app_password: smtpAppPassword,
        }),
      });

      if (!res.ok || !res.body) throw new Error("send_failed");

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
              setProgress((p) => ({
                ...p,
                total: data.total || 0,
                done: 0,
                remaining: data.remaining || 0,
                delivery: data.delivery || "",
              }));
            } else if (data.type === "log") {
              if (data.log) setLiveLog((prev) => [...prev, data.log]);
              if (typeof data.skipped === "number") setProgress((p) => ({ ...p, skipped: data.skipped }));
            } else if (data.type === "progress") {
              setProgress((p) => ({
                ...p,
                total: data.total ?? p.total,
                done: data.done ?? p.done,
                remaining: data.remaining ?? p.remaining,
                sent: data.sent ?? p.sent,
                failed: data.failed ?? p.failed,
                skipped: data.skipped ?? p.skipped,
              }));
              if (data.log) setLiveLog((prev) => [...prev, data.log]);
            } else if (data.type === "batch") {
              if (data.remaining != null && data.total != null) {
                setLiveLog((prev) => [
                  ...prev,
                  `batch:${data.batch_size} done:${data.done}/${data.total} remaining:${data.remaining}`,
                ]);
              }
            } else if (data.type === "done") {
              setResult(data);
              setToast("Mailing completed.");
              setTimeout(() => setToast(""), 1800);
            }
          }
        }
      }

      loadCampaigns();

    } catch {

      setResult({ error: true });

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

        <h1 className="text-2xl font-bold text-slate-900">Send mail</h1>

        <p className="text-slate-600 mt-2 text-sm">
          Upload or paste a full responsive HTML template. Use tokens like{" "}
          <code className="bg-slate-100 px-1 rounded text-xs">
            {"{{name}} {{email}} {{roll_number}} {{unique_id}} {{qr_url}} {{pass_url}} {{department_name}}"}
          </code>{" "}
          to embed the QR and pass images directly in the HTML body (example:{" "}
          <code className="bg-slate-100 px-1 rounded text-xs">
            {'<img src="{{qr_url}}" /> <img src="{{pass_url}}" />'}
          </code>
          ). You can merge any attendee-table column by tokenizing its name (example: "College Name"
          becomes <code className="bg-slate-100 px-1 rounded text-xs">{"{{college_name}}"}</code>).
          Email is resolved in this order: attendee email, Excel column "Email"/"Email Address",
          then form question titled "Email". Once mailed successfully, attendees are skipped on
          future runs.
        </p>
        <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-900">
          <p className="font-semibold">Step 1: Configure Admin Gmail SMTP</p>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Use admin Gmail (example: admin.events@gmail.com).</li>
            <li>Enable 2-Step Verification in Google Account security.</li>
            <li>Create an App Password and paste it below.</li>
            <li>Use host <code>smtp.gmail.com</code> and port <code>587</code>.</li>
          </ol>
        </div>

        <div className="flex gap-2 mt-6">

          <button

            type="button"

            onClick={() => setTab("pass_mail")}

            className={`px-4 py-2 rounded-lg text-sm font-medium ${

              tab === "pass_mail"

                ? "bg-emerald-600 text-white"

                : "bg-slate-100 text-slate-700"

            }`}

          >

            Mail passes

          </button>

          <button

            type="button"

            onClick={() => setTab("other")}

            className={`px-4 py-2 rounded-lg text-sm font-medium ${

              tab === "other"

                ? "bg-emerald-600 text-white"

                : "bg-slate-100 text-slate-700"

            }`}

          >

            Other mail

          </button>

        </div>

        <div className="mt-6 space-y-4 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-slate-700">
              SMTP Host
              <input
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              SMTP Port
              <input
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Admin Gmail
              <input
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="admin.events@gmail.com"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Gmail App Password
              <input
                type="password"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                value={smtpAppPassword}
                onChange={(e) => setSmtpAppPassword(e.target.value)}
                placeholder="xxxx xxxx xxxx xxxx"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">

            Subject

            <input

              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"

              value={subject}

              onChange={(e) => setSubject(e.target.value)}

            />

          </label>

          <label className="block text-sm font-medium text-slate-700">

            HTML body

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setHtml(RESPONSIVE_TEMPLATE)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
              >
                Use responsive template
              </button>

              <label className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 cursor-pointer">
                Load HTML file
                <input
                  type="file"
                  accept=".html,.htm,text/html"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const r = new FileReader();
                    r.onload = () => setHtml(String(r.result || ""));
                    r.readAsText(f);
                  }}
                />
              </label>
            </div>

            <textarea

              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm min-h-[160px]"

              value={html}

              onChange={(e) => setHtml(e.target.value)}

            />

          </label>

          <button

            type="button"

            disabled={busy}

            onClick={send}

            className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"

          >

            {busy ? "Sending…" : "Start mails"}

          </button>

          {busy && progress.total > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-slate-700">
                Remaining: <strong>{progress.remaining}</strong> / {progress.total} — sent{" "}
                <strong>{progress.sent}</strong>, failed <strong>{progress.failed}</strong>, skipped{" "}
                <strong>{progress.skipped}</strong>
              </p>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{
                    width: `${progress.total ? Math.min(100, (progress.done / progress.total) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {liveLog.length > 0 && (
            <div className="bg-slate-900 text-slate-100 rounded-xl p-3 text-xs font-mono max-h-40 overflow-y-auto">
              {liveLog.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          )}

          {result && !result.error && (

            <div className="text-sm text-slate-700 space-y-2">

              <p>

                Delivery mode: <strong>{result.delivery}</strong> — sent{" "}
                <strong>{result.sent}</strong> / {result.total}

              </p>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-3 text-xs font-mono max-h-40 overflow-y-auto">
                {liveLog.map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>

            </div>

          )}

          {result?.error && (

            <p className="text-sm text-red-600">Send failed.</p>

          )}

        </div>
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
            {toast}
          </div>
        )}

        <div className="mt-10">

          <h2 className="font-semibold text-slate-900">Stored campaigns</h2>

          <p className="text-sm text-slate-600 mt-1">

            Recent mailing setups and logs for this event.

          </p>

          <ul className="mt-4 space-y-3">

            {campaigns.map((c) => (

              <li

                key={c.id}

                className="border border-slate-200 rounded-xl p-4 text-sm bg-white"

              >

                <div className="flex justify-between gap-2">

                  <span className="font-medium capitalize">

                    {c.campaign_type?.replace(/_/g, " ")}

                  </span>

                  <span className="text-slate-500 text-xs">{c.created_at}</span>

                </div>

                <p className="text-slate-600 mt-1">{c.subject}</p>

                <details className="mt-2">

                  <summary className="cursor-pointer text-blue-600 text-xs">

                    Log

                  </summary>

                  <pre className="mt-2 text-xs bg-slate-50 p-2 rounded overflow-x-auto">

                    {(c.log_lines || []).join("\n")}

                  </pre>

                </details>

              </li>

            ))}

          </ul>

          {campaigns.length === 0 && (

            <p className="text-sm text-slate-500 mt-3">No campaigns yet.</p>

          )}

        </div>

      </div>

    </DashboardLayout>

  );

}

export default EventMailingSendPage;
