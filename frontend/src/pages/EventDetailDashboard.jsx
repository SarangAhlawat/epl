import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import EventStats from "../components/EventStats";
import {
  ClipboardList,
  Mail,
  QrCode,
  FileSpreadsheet,
  RefreshCw
} from "lucide-react";

function EventDetailDashboard() {

  const { eventId } = useParams();

  const [event, setEvent] = useState(null);

  const [stats, setStats] = useState(null);

  const [sheet, setSheet] = useState(null);

  const [error, setError] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(() => {

    API.get(`/events/${eventId}`)

      .then((res) => {

        if (res.data?.status === "event_not_found") {

          setError("Event not found.");

          return;

        }

        setError("");

        setEvent(res.data);

      })

      .catch(() => setError("Failed to load event details."));

    API.get(`/events/${eventId}/stats`)

      .then((res) => setStats(res.data))

      .catch(() => {});

    API.get(`/events/${eventId}/attendees/sheet`)

      .then((res) => setSheet(res.data))

      .catch(() => setSheet(null));

  }, [eventId]);

  useEffect(() => {

    loadAll();

  }, [loadAll]);

  const refresh = async () => {

    setRefreshing(true);

    await loadAll();

    setRefreshing(false);

  };

  if (error && !event) {

    return (

      <DashboardLayout>

        <p className="text-red-600">{error}</p>

      </DashboardLayout>

    );

  }

  if (!event || !stats || !sheet) {

    return (

      <DashboardLayout>

        <p className="text-slate-600">Loading event…</p>

      </DashboardLayout>

    );

  }

  const qCols = sheet.question_columns || [];

  const rows = sheet.rows || [];

  const regUrl = `${window.location.origin}/events/${eventId}/register`;

  const actionCard =

    "flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition text-left";

  return (

    <DashboardLayout>

      <div className="space-y-8">

        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 text-white">

          <img

            src={event.logo_url}

            alt=""

            className="absolute inset-0 h-full w-full object-cover opacity-40"

          />

          <div className="relative p-6 sm:p-8">

            <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">

              Event command center

            </p>

            <h1 className="text-2xl sm:text-3xl font-bold mt-2">{event.title}</h1>

            <p className="text-slate-200 mt-2 max-w-2xl text-sm sm:text-base">

              {event.description}

            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">

              <span>{event.venue}</span>

              <span>·</span>

              <span>

                {event.date

                  ? new Date(event.date).toLocaleString()

                  : "Date TBD"}

              </span>

              {event.form_published && (

                <>

                  <span>·</span>

                  <span className="text-emerald-300">Registration form live</span>

                </>

              )}

            </div>

          </div>

        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">

          <EventStats stats={stats} />

          <button

            type="button"

            onClick={refresh}

            disabled={refreshing}

            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"

          >

            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />

            Refresh data

          </button>

        </div>

        <section>

          <h2 className="text-lg font-semibold text-slate-900">Workflow</h2>

          <p className="text-sm text-slate-600 mt-1">

            Everything below is scoped to this event. The attendee table is your central

            view for registrations, form answers, passes, mail status, and check-in.

          </p>

          <div className="mt-4 grid sm:grid-cols-3 gap-4">

            <Link

              to={`/dashboard/event/${eventId}/forms`}

              className={actionCard}

            >

              <ClipboardList className="text-blue-600" size={26} />

              <span className="mt-3 font-semibold text-slate-900">Event forms</span>

              <span className="text-sm text-slate-600 mt-1">

                Edit questions, save, preview, publish, copy the public registration link.

              </span>

              <span className="mt-3 text-xs font-mono text-blue-700 break-all">

                {regUrl}

              </span>

            </Link>

            <Link

              to={`/dashboard/event/${eventId}/mailing`}

              className={actionCard}

            >

              <Mail className="text-emerald-600" size={26} />

              <span className="mt-3 font-semibold text-slate-900">Mailing</span>

              <span className="text-sm text-slate-600 mt-1">

                Generate passes, bulk QR images, and run pass or general email campaigns.

              </span>

            </Link>

            <Link

              to={`/dashboard/event/${eventId}/checkin`}

              className={actionCard}

            >

              <QrCode className="text-violet-600" size={26} />

              <span className="mt-3 font-semibold text-slate-900">Check-in scan</span>

              <span className="text-sm text-slate-600 mt-1">

                Camera QR, paste code, or search attendees and mark checked-in.

              </span>

            </Link>

          </div>

        </section>

        <div className="flex flex-wrap gap-3">

          <Link

            to={`/dashboard/events/${event.id}/excel`}

            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-emerald-700"

          >

            <FileSpreadsheet size={18} />

            Upload Excel

          </Link>

          <Link

            to="/dashboard/events"

            className="inline-flex items-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"

          >

            All events

          </Link>

        </div>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap justify-between gap-2">

            <div>

              <h2 className="text-lg font-semibold text-slate-900">Attendee table</h2>

              <p className="text-sm text-slate-600 mt-0.5">

                Core columns plus form fields, assets, mail delivery, and check-in state.

              </p>

            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-xs sm:text-sm min-w-[960px]">

              <thead>

                <tr className="text-left text-slate-500 border-b border-slate-100 bg-slate-50/80">

                  <th className="py-3 px-3 font-medium whitespace-nowrap">Name</th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap">Email</th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap">Roll/ID</th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap">Source</th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap">Code</th>

                  {qCols.map((c) => (

                    <th

                      key={c.id}

                      className="py-3 px-3 font-medium whitespace-nowrap max-w-[140px]"

                      title={c.label}

                    >

                      <span className="line-clamp-2">{c.label}</span>

                    </th>

                  ))}

                  <th className="py-3 px-3 font-medium whitespace-nowrap">Pass</th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap">QR</th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap">Pass mail</th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap">Other mail</th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap">Checked in</th>

                </tr>

              </thead>

              <tbody>

                {rows.map((a) => (

                  <tr

                    key={a.id}

                    className="border-b border-slate-100 hover:bg-slate-50/60"

                  >

                    <td className="py-2 px-3 whitespace-nowrap">{a.name || "—"}</td>

                    <td className="py-2 px-3 max-w-[160px] truncate" title={a.email}>

                      {a.email || "—"}

                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">

                      {a.roll_number || "—"}

                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">{a.source || "—"}</td>

                    <td className="py-2 px-3 font-mono text-xs whitespace-nowrap">

                      {a.unique_id || "—"}

                    </td>

                    {qCols.map((c) => (

                      <td key={c.id} className="py-2 px-3 max-w-[140px]">

                        <span className="line-clamp-2 break-words">

                          {a.responses?.[c.id] ?? "—"}

                        </span>

                      </td>

                    ))}

                    <td className="py-2 px-3">

                      {a.pass_url ? (

                        <a

                          href={a.pass_url}

                          className="text-blue-600 hover:underline"

                          target="_blank"

                          rel="noreferrer"

                        >

                          Open

                        </a>

                      ) : (

                        "—"

                      )}

                    </td>

                    <td className="py-2 px-3">

                      {a.qr_url ? (

                        <a

                          href={a.qr_url}

                          className="text-blue-600 hover:underline"

                          target="_blank"

                          rel="noreferrer"

                        >

                          Image

                        </a>

                      ) : (

                        "—"

                      )}

                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">

                      {a.pass_mail_status || "—"}

                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">

                      {a.other_mail_status || "—"}

                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">

                      {a.checked_in ? (

                        <span className="text-emerald-700 font-medium">Yes</span>

                      ) : (

                        <span className="text-slate-400">No</span>

                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

          {rows.length === 0 && (

            <p className="text-sm text-slate-600 px-5 py-6">

              No attendees yet. Publish a form, share the registration link, or import

              Excel.

            </p>

          )}

        </section>

      </div>

    </DashboardLayout>

  );

}

export default EventDetailDashboard;
