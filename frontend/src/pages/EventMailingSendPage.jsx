import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import { ArrowLeft } from "lucide-react";

function EventMailingSendPage() {

  const { eventId } = useParams();

  const [tab, setTab] = useState("pass_mail");

  const [subject, setSubject] = useState("Your event pass");

  const [html, setHtml] = useState(

    "<p>Hi {{name}},</p><p>Thanks for registering. Your check-in code is <strong>{{unique_id}}</strong>.</p>"

  );

  const [attachPass, setAttachPass] = useState(true);

  const [busy, setBusy] = useState(false);

  const [result, setResult] = useState(null);

  const [campaigns, setCampaigns] = useState([]);

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

    try {

      const res = await API.post(`/events/${eventId}/mailing/send`, {

        campaign_type: tab,

        subject,

        html_body: html,

        attach_pass_link: tab === "pass_mail" ? attachPass : false

      });

      setResult(res.data);

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

          Uses the same merge tokens as passes. With Resend configured on the server,

          messages are delivered; otherwise sends are simulated and still logged.

        </p>

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

            <textarea

              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 font-mono text-sm min-h-[160px]"

              value={html}

              onChange={(e) => setHtml(e.target.value)}

            />

          </label>

          {tab === "pass_mail" && (

            <label className="flex items-center gap-2 text-sm text-slate-700">

              <input

                type="checkbox"

                checked={attachPass}

                onChange={(e) => setAttachPass(e.target.checked)}

              />

              Append pass download link and QR image when available

            </label>

          )}

          <button

            type="button"

            disabled={busy}

            onClick={send}

            className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-medium disabled:opacity-50"

          >

            {busy ? "Sending…" : "Start mails"}

          </button>

          {result && !result.error && (

            <div className="text-sm text-slate-700 space-y-2">

              <p>

                Delivery mode: <strong>{result.delivery}</strong> — sent{" "}

                <strong>{result.sent}</strong> / {result.total}

              </p>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-3 text-xs font-mono max-h-40 overflow-y-auto">

                {(result.log || []).map((line, i) => (

                  <div key={i}>{line}</div>

                ))}

              </div>

            </div>

          )}

          {result?.error && (

            <p className="text-sm text-red-600">Send failed.</p>

          )}

        </div>

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
