import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import EventStats from "../components/EventStats";
import {
  ClipboardList,
  Mail,
  QrCode,
  FileSpreadsheet,
  RefreshCw,
  Download,
  ArrowUpDown
} from "lucide-react";

function EventDetailDashboard() {

  const { eventId } = useParams();

  const [event, setEvent] = useState(null);

  const [stats, setStats] = useState(null);

  const [sheet, setSheet] = useState(null);

  const [error, setError] = useState("");

  const [refreshing, setRefreshing] = useState(false);
  const [sortKey, setSortKey] = useState("checked_in");
  const [sortDir, setSortDir] = useState("desc");
  const [filters, setFilters] = useState({});
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

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

  const resetAttendee = useCallback(
    async (attendeeId, fields) => {
      const label = Array.isArray(fields) ? fields.join(", ") : String(fields || "");
      const ok = window.confirm(`Mark as not done? This will reset: ${label}`);
      if (!ok) return;

      const body = {
        pass_url: fields.includes("pass_url"),
        qr_url: fields.includes("qr_url"),
        pass_mail_status: fields.includes("pass_mail_status"),
        other_mail_status: fields.includes("other_mail_status"),
      };

      try {
        await API.post(`/events/${eventId}/attendees/${attendeeId}/reset`, body);
        await loadAll();
      } catch {
        alert("Reset failed.");
      }
    },
    [eventId, loadAll]
  );

  const qCols = useMemo(() => (sheet?.question_columns || []), [sheet]);
  const excelCols = useMemo(() => (sheet?.excel_columns || []), [sheet]);
  const rows = useMemo(() => (sheet?.rows || []), [sheet]);

  const downloadHeaderKeys = useMemo(() => {
    return [
      "name",
      "email",
      "roll_number",
      "source",
      "unique_id",
      ...excelCols,
      ...qCols.map((c) => c.label),
      "pass_url",
      "qr_url",
      "pass_mail_status",
      "other_mail_status",
      "checked_in",
    ];
  }, [excelCols, qCols]);
  const [downloadCols, setDownloadCols] = useState(downloadHeaderKeys);
  const [downloadCheckedFirst, setDownloadCheckedFirst] = useState(true);

  useEffect(() => {
    setDownloadCols(downloadHeaderKeys);
  }, [downloadHeaderKeys]);

  const regUrl = `${window.location.origin}/events/${eventId}/register`;

  const actionCard =

    "flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md transition text-left";

  const getCellValue = useCallback(
    (a, key) => {
      if (key.startsWith("extra:")) return a.extra_data?.[key.slice(6)] ?? "";
      if (key.startsWith("form:")) return a.responses?.[key.slice(5)] ?? "";
      if (key === "checked_in") return a.checked_in ? "Yes" : "No";
      return a[key] ?? "";
    },
    []
  );

  const displayedRows = useMemo(() => {
    const filtered = rows.filter((a) => {
      return Object.entries(filters).every(([k, q]) => {
        const query = String(q || "").trim().toLowerCase();
        if (!query) return true;
        const val = String(getCellValue(a, k) || "").toLowerCase();
        return val.includes(query);
      });
    });

    const dir = sortDir === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      const av = String(getCellValue(a, sortKey) || "").toLowerCase();
      const bv = String(getCellValue(b, sortKey) || "").toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return filtered;
  }, [rows, filters, sortKey, sortDir, getCellValue]);

  const setFilter = (k, v) => setFilters((prev) => ({ ...prev, [k]: v }));
  const onSort = (k) => {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(k);
    setSortDir("asc");
  };

  const downloadHref = useMemo(() => {
    if (!event?.id) return "#";
    const params = new URLSearchParams();
    if (downloadCols.length > 0) params.set("include_columns", downloadCols.join(","));
    params.set("checked_first", downloadCheckedFirst ? "true" : "false");
    return `${API.defaults.baseURL}/events/${event.id}/attendees/download?${params.toString()}`;
  }, [downloadCols, downloadCheckedFirst, event?.id]);

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

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">

          <EventStats stats={stats} />

          <button

            type="button"

            onClick={refresh}

            disabled={refreshing}

            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 w-full sm:w-auto"

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

            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white px-5 py-2.5 text-sm font-semibold shadow-sm hover:bg-emerald-700 w-full sm:w-auto"

          >

            <FileSpreadsheet size={18} />

            Upload Excel

          </Link>

          <Link

            to="/dashboard/events"

            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 w-full sm:w-auto"

          >

            All events

          </Link>

          <button
            type="button"
            onClick={() => setShowDownloadOptions(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 w-full sm:w-auto"
          >
            <Download size={17} />
            Download attendee Excel
          </button>

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

                  <th className="py-3 px-3 font-medium whitespace-nowrap">
                    <button type="button" onClick={() => onSort("name")} className="inline-flex items-center gap-1">Name <ArrowUpDown size={13} /></button>
                  </th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap"><button type="button" onClick={() => onSort("email")} className="inline-flex items-center gap-1">Email <ArrowUpDown size={13} /></button></th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap"><button type="button" onClick={() => onSort("roll_number")} className="inline-flex items-center gap-1">Roll/ID <ArrowUpDown size={13} /></button></th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap"><button type="button" onClick={() => onSort("source")} className="inline-flex items-center gap-1">Source <ArrowUpDown size={13} /></button></th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap"><button type="button" onClick={() => onSort("unique_id")} className="inline-flex items-center gap-1">Code <ArrowUpDown size={13} /></button></th>
                  {excelCols.map((c) => (
                    <th
                      key={`excel-${c}`}
                      className="py-3 px-3 font-medium whitespace-nowrap max-w-[140px]"
                      title={c}
                    >
                      <button type="button" onClick={() => onSort(`extra:${c}`)} className="inline-flex items-center gap-1"><span className="line-clamp-2">{c}</span> <ArrowUpDown size={13} /></button>
                    </th>
                  ))}

                  {qCols.map((c) => (

                    <th

                      key={c.id}

                      className="py-3 px-3 font-medium whitespace-nowrap max-w-[140px]"

                      title={c.label}

                    >

                      <button type="button" onClick={() => onSort(`form:${c.id}`)} className="inline-flex items-center gap-1"><span className="line-clamp-2">{c.label}</span> <ArrowUpDown size={13} /></button>

                    </th>

                  ))}

                  <th className="py-3 px-3 font-medium whitespace-nowrap"><button type="button" onClick={() => onSort("pass_url")} className="inline-flex items-center gap-1">Pass <ArrowUpDown size={13} /></button></th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap"><button type="button" onClick={() => onSort("qr_url")} className="inline-flex items-center gap-1">QR <ArrowUpDown size={13} /></button></th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap"><button type="button" onClick={() => onSort("pass_mail_status")} className="inline-flex items-center gap-1">Pass mail <ArrowUpDown size={13} /></button></th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap"><button type="button" onClick={() => onSort("other_mail_status")} className="inline-flex items-center gap-1">Other mail <ArrowUpDown size={13} /></button></th>

                  <th className="py-3 px-3 font-medium whitespace-nowrap"><button type="button" onClick={() => onSort("checked_in")} className="inline-flex items-center gap-1">Checked in <ArrowUpDown size={13} /></button></th>

                </tr>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={filters.name || ""} onChange={(e) => setFilter("name", e.target.value)} placeholder="Filter" /></th>
                  <th className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={filters.email || ""} onChange={(e) => setFilter("email", e.target.value)} placeholder="Filter" /></th>
                  <th className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={filters.roll_number || ""} onChange={(e) => setFilter("roll_number", e.target.value)} placeholder="Filter" /></th>
                  <th className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={filters.source || ""} onChange={(e) => setFilter("source", e.target.value)} placeholder="Filter" /></th>
                  <th className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={filters.unique_id || ""} onChange={(e) => setFilter("unique_id", e.target.value)} placeholder="Filter" /></th>
                  {excelCols.map((c) => (
                    <th key={`fx-${c}`} className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={filters[`extra:${c}`] || ""} onChange={(e) => setFilter(`extra:${c}`, e.target.value)} placeholder="Filter" /></th>
                  ))}
                  {qCols.map((c) => (
                    <th key={`fq-${c.id}`} className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={filters[`form:${c.id}`] || ""} onChange={(e) => setFilter(`form:${c.id}`, e.target.value)} placeholder="Filter" /></th>
                  ))}
                  <th className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={filters.pass_url || ""} onChange={(e) => setFilter("pass_url", e.target.value)} placeholder="Filter" /></th>
                  <th className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={filters.qr_url || ""} onChange={(e) => setFilter("qr_url", e.target.value)} placeholder="Filter" /></th>
                  <th className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={filters.pass_mail_status || ""} onChange={(e) => setFilter("pass_mail_status", e.target.value)} placeholder="Filter" /></th>
                  <th className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={filters.other_mail_status || ""} onChange={(e) => setFilter("other_mail_status", e.target.value)} placeholder="Filter" /></th>
                  <th className="px-3 py-2"><input className="w-full border rounded px-2 py-1" value={filters.checked_in || ""} onChange={(e) => setFilter("checked_in", e.target.value)} placeholder="Yes/No" /></th>
                </tr>

              </thead>

              <tbody>

                {displayedRows.map((a) => (

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
                    {excelCols.map((c) => (
                      <td key={`excel-cell-${a.id}-${c}`} className="py-2 px-3 max-w-[140px]">
                        <span className="line-clamp-2 break-words">
                          {a.extra_data?.[c] ?? "—"}
                        </span>
                      </td>
                    ))}

                    {qCols.map((c) => (

                      <td key={c.id} className="py-2 px-3 max-w-[140px]">

                        <span className="line-clamp-2 break-words">

                          {a.responses?.[c.id] ?? "—"}

                        </span>

                      </td>

                    ))}

                    <td className="py-2 px-3">

                      {a.pass_url ? (

                        <div className="flex items-center gap-2">
                          <a
                            href={a.pass_url}
                            className="text-blue-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open
                          </a>
                          <button
                            type="button"
                            onClick={() => resetAttendee(a.id, ["pass_url", "pass_mail_status"])}
                            className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                            title="Reset pass + pass mail status"
                          >
                            Not done
                          </button>
                        </div>

                      ) : (

                        "—"

                      )}

                    </td>

                    <td className="py-2 px-3">

                      {a.qr_url ? (

                        <div className="flex items-center gap-2">
                          <a
                            href={a.qr_url}
                            className="text-blue-600 hover:underline"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Image
                          </a>
                          <button
                            type="button"
                            onClick={() => resetAttendee(a.id, ["qr_url", "pass_url", "pass_mail_status"])}
                            className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                            title="Reset QR + pass + pass mail status"
                          >
                            Not done
                          </button>
                        </div>

                      ) : (

                        "—"

                      )}

                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">

                      {a.pass_mail_status ? (
                        <button
                          type="button"
                          onClick={() => resetAttendee(a.id, ["pass_mail_status"])}
                          className="text-left hover:underline"
                          title="Click to reset to not done"
                        >
                          {a.pass_mail_status}
                        </button>
                      ) : (
                        "—"
                      )}

                    </td>

                    <td className="py-2 px-3 whitespace-nowrap">

                      {a.other_mail_status ? (
                        <button
                          type="button"
                          onClick={() => resetAttendee(a.id, ["other_mail_status"])}
                          className="text-left hover:underline"
                          title="Click to reset to not done"
                        >
                          {a.other_mail_status}
                        </button>
                      ) : (
                        "—"
                      )}

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

          {displayedRows.length === 0 && (

            <p className="text-sm text-slate-600 px-5 py-6">

              No attendees yet. Publish a form, share the registration link, or import

              Excel.

            </p>

          )}

        </section>

        {showDownloadOptions && (
          <div className="fixed inset-0 bg-black/35 z-40 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-xl p-5">
              <h3 className="text-lg font-semibold text-slate-900">Download options</h3>
              <p className="text-sm text-slate-600 mt-1">Choose columns to include and sorting preference.</p>
              <label className="flex items-center gap-2 mt-4 text-sm">
                <input
                  type="checkbox"
                  checked={downloadCheckedFirst}
                  onChange={(e) => setDownloadCheckedFirst(e.target.checked)}
                />
                Checked-in attendees first
              </label>
              <div className="mt-4 max-h-60 overflow-y-auto border rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
                {downloadHeaderKeys.map((k) => (
                  <label key={k} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={downloadCols.includes(k)}
                      onChange={(e) => {
                        setDownloadCols((prev) =>
                          e.target.checked ? [...prev, k] : prev.filter((x) => x !== k)
                        );
                      }}
                    />
                    {k}
                  </label>
                ))}
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 border rounded-lg"
                  onClick={() => setShowDownloadOptions(false)}
                >
                  Cancel
                </button>
                <a
                  href={downloadHref}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  onClick={() => setShowDownloadOptions(false)}
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        )}

      </div>

    </DashboardLayout>

  );

}

export default EventDetailDashboard;
