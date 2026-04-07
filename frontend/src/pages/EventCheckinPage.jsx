import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BrowserQRCodeReader, BrowserCodeReader } from "@zxing/browser";

import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import { ArrowLeft, Search, CheckCircle, XCircle } from "lucide-react";

function EventCheckinPage() {
  const { eventId } = useParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [mailFields, setMailFields] = useState(["name", "email", "roll_number", "unique_id"]);
  const [availableMailFields, setAvailableMailFields] = useState([
    { key: "name", label: "name" },
    { key: "email", label: "email" },
    { key: "roll_number", label: "roll_number" },
    { key: "unique_id", label: "unique_id" },
  ]);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [scanning, setScanning] = useState(false);
  const [toast, setToast] = useState(null);

  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const controlsRef = useRef(null);
  const scanningRef = useRef(false);
  const scanLockRef = useRef(false);
  const lastScanRef = useRef({ code: "", at: 0 });
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, kind = "info") => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast({ message, kind });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 1400);
  }, []);

  const search = useCallback(() => {
    API.get(`/events/${eventId}/attendees/search`, { params: { q: query } }).then((res) => {
      setResults(Array.isArray(res.data) ? res.data : []);
    });
  }, [eventId, query]);

  const loadLogs = useCallback(async () => {
    const res = await API.get(`/events/${eventId}/checkin-logs`, { params: { limit: 5 } });
    setLogs(Array.isArray(res.data) ? res.data : []);
  }, [eventId]);

  const loadMailFieldOptions = useCallback(async () => {
    const res = await API.get(`/events/${eventId}/attendees/sheet`);
    const excelCols = Array.isArray(res.data?.excel_columns) ? res.data.excel_columns : [];
    const qCols = Array.isArray(res.data?.question_columns) ? res.data.question_columns : [];
    setAvailableMailFields([
      { key: "name", label: "name" },
      { key: "email", label: "email" },
      { key: "roll_number", label: "roll_number" },
      { key: "unique_id", label: "unique_id" },
      ...excelCols.map((c) => ({ key: `extra:${c}`, label: c })),
      ...qCols.map((q) => ({ key: `form:${q.id}`, label: q.label })),
    ]);
  }, [eventId]);

  useEffect(() => {
    const t = setTimeout(search, 250);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    (async () => {
      try {
        await loadLogs();
      } catch {
        // ignore
      }
    })();
  }, [loadLogs]);

  useEffect(() => {
    (async () => {
      try {
        await loadMailFieldOptions();
      } catch {
        // ignore
      }
    })();
  }, [loadMailFieldOptions]);

  const checkIn = useCallback(
    async (payload) => {
      setStatus("");
      try {
        const res = await API.post(`/events/${eventId}/check-in`, {
          ...payload,
          send_checkin_mail: true,
          selected_mail_fields: mailFields,
        });
        const mailStatus = res.data?.mail_status ? ` | mail: ${res.data.mail_status}` : "";
        const successText = `Checked in: ${res.data.name || res.data.attendee_id}${mailStatus}`;
        setStatus(successText);
        showToast(`Checked in: ${res.data.name || res.data.attendee_id}`, "success");
        search();
        await loadLogs();
      } catch (e) {
        const d = e.response?.data?.detail;
        const errorText = typeof d === "string" ? d : "Check-in failed.";
        setStatus(errorText);
        showToast(errorText, "error");
      }
    },
    [eventId, mailFields, search, loadLogs, showToast]
  );

  const uncheckIn = async (payload) => {
    setStatus("");
    try {
      const res = await API.post(`/events/${eventId}/uncheck-in`, payload);
      setStatus(`Unchecked: ${res.data.name || res.data.attendee_id}`);
      search();
      await loadLogs();
    } catch (e) {
      const d = e.response?.data?.detail;
      setStatus(typeof d === "string" ? d : "Uncheck failed.");
    }
  };

  const parseQrPayload = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return null;
    const parts = s.split("|");
    if (parts.length === 2 && parts[0] && parts[1]) return { unique_id: parts[1].trim() };
    return { unique_id: s };
  };

  const stopScanner = useCallback(() => {
    scanningRef.current = false;
    setScanning(false);
    scanLockRef.current = false;
    lastScanRef.current = { code: "", at: 0 };

    try {
      controlsRef.current?.stop();
    } catch {
      // ignore
    }
    controlsRef.current = null;
    readerRef.current = null;

    try {
      BrowserCodeReader.releaseAllStreams();
    } catch {
      // ignore
    }

    const v = videoRef.current;
    if (v) {
      try {
        BrowserCodeReader.cleanVideoSource(v);
      } catch {
        v.srcObject = null;
      }
    }
  }, []);

  const pickBackCameraId = (devices) => {
    if (!devices?.length) return undefined;
    for (const d of devices) {
      const label = (d.label || "").toLowerCase();
      if (
        label.includes("back") ||
        label.includes("rear") ||
        label.includes("environment") ||
        label.includes("facing back")
      ) {
        return d.deviceId;
      }
    }
    return devices[0].deviceId;
  };

  const startScanner = useCallback(async () => {
    const host = window.location.hostname;
    const secure =
      window.isSecureContext || host === "localhost" || host === "127.0.0.1";
    if (!secure) {
      setStatus(
        "Camera needs a secure page (https://) or localhost. On iPhone, http://YOUR-LAN-IP blocks the camera—use HTTPS or manual check-in."
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus(
        "Camera API unavailable (often fixed by opening the site over HTTPS). Use manual code or search below."
      );
      return;
    }

    stopScanner();
    scanLockRef.current = false;
    lastScanRef.current = { code: "", at: 0 };
    scanningRef.current = true;
    setScanning(true);
    setStatus("Starting camera…");

    const video = videoRef.current;
    if (!video) {
      setStatus("Scanner not ready. Refresh the page and try again.");
      stopScanner();
      return;
    }

    const reader = new BrowserQRCodeReader(undefined, {
      delayBetweenScanAttempts: 120,
      tryPlayVideoTimeout: 10000,
    });
    readerRef.current = reader;

    const onDecode = (result, _err, controls) => {
      if (!result || !scanningRef.current) return;
      const text = result.getText();
      const parsed = parseQrPayload(text);
      if (!parsed?.unique_id) return;

      const now = Date.now();
      const last = lastScanRef.current;
      if (scanLockRef.current) return;
      if (last.code === parsed.unique_id && now - last.at < 1200) return;

      scanLockRef.current = true;
      lastScanRef.current = { code: parsed.unique_id, at: now };
      // Keep camera running for continuous scanning; release lock quickly after request.
      void checkIn(parsed).finally(() => {
        window.setTimeout(() => {
          scanLockRef.current = false;
        }, 250);
      });
      if (controls && typeof controls.stop !== "function") {
        scanLockRef.current = false;
      }
    };

    const setScannerError = (err) => {
      const name = err?.name || "";
      const msg = String(err?.message || err || "");
      if (name === "NotAllowedError" || msg.includes("Permission")) {
        setStatus("Camera permission denied. Allow camera for this site in the browser settings.");
      } else if (
        name === "NotFoundError" ||
        name === "OverconstrainedError" ||
        msg.includes("Devices could not be found")
      ) {
        setStatus("No matching camera found. Try another device or use manual check-in.");
      } else if (name === "NotReadableError" || msg.includes("Could not start video source")) {
        setStatus("Camera is busy or blocked. Close other apps using the camera and try again.");
      } else {
        setStatus(`Scanner error: ${msg || "unknown"}`);
      }
    };

    const isLikelyPhone =
      /iphone|ipad|ipod|android/i.test(navigator.userAgent || "") ||
      (typeof window !== "undefined" && window.matchMedia?.("(max-width: 900px)").matches);

    try {
      // On phones, prefer the back camera first.
      if (isLikelyPhone) {
        try {
          const controls = await reader.decodeFromConstraints(
            { video: { facingMode: { exact: "environment" } } },
            video,
            onDecode
          );
          controlsRef.current = controls;
          setStatus("Point the camera at the attendee QR code…");
          return;
        } catch {
          // fall through to "ideal" (less strict)
        }

        try {
          const controls = await reader.decodeFromConstraints(
            { video: { facingMode: { ideal: "environment" } } },
            video,
            onDecode
          );
          controlsRef.current = controls;
          setStatus("Point the camera at the attendee QR code…");
          return;
        } catch {
          // fall through
        }
      }

      // Desktop-friendly: request any camera first (environment may not exist on laptops).
      const controls = await reader.decodeFromConstraints({ video: true }, video, onDecode);
      controlsRef.current = controls;
      setStatus("Point the camera at the attendee QR code…");
    } catch (e1) {
      try {
        const devices = await BrowserCodeReader.listVideoInputDevices();
        const deviceId = pickBackCameraId(devices);
        if (!deviceId) throw e1;
        const controls = await reader.decodeFromVideoDevice(deviceId, video, onDecode);
        controlsRef.current = controls;
        setStatus("Point the camera at the attendee QR code…");
      } catch (e2) {
        stopScanner();
        setScannerError(e2);
      }
    }
  }, [checkIn, stopScanner]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      stopScanner();
    },
    [stopScanner]
  );

  const submitCode = () => {
    const parsed = parseQrPayload(code);
    if (parsed?.unique_id) checkIn(parsed);
    else setStatus("Enter a valid check-in code.");
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl w-full mx-auto px-0 sm:px-0">
        <Link
          to={`/dashboard/event/${eventId}`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 mb-4 sm:mb-6"
        >
          <ArrowLeft size={16} />
          Event hub
        </Link>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Check-in scan</h1>
        <p className="text-slate-600 mt-2 text-sm">
          QR scanning uses ZXing (Chrome-friendly). You can also paste a code or search.
        </p>

        <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm font-medium text-slate-900">Auto check-in confirmation mail</p>
          <p className="text-xs text-slate-500 mt-1">
            On each check-in, a confirmation email is sent with name plus selected fields.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {availableMailFields.map((f) => {
              const active = mailFields.includes(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() =>
                    setMailFields((prev) =>
                      prev.includes(f.key) ? prev.filter((x) => x !== f.key) : [...prev, f.key]
                    )
                  }
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    active
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-slate-300 text-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">QR scanner</h2>
            {/* <p className="text-xs text-slate-500 mt-1">
              Allow camera when Chrome prompts. Use HTTPS if you open the app
              from a phone on your LAN.
            </p> */}
            <div className="mt-4 rounded-xl overflow-hidden bg-black aspect-video min-h-[150px]">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
                autoPlay
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              {!scanning ? (
                <button
                  type="button"
                  onClick={startScanner}
                  className="bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium w-full sm:w-auto"
                >
                  Start camera
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopScanner}
                  className="bg-slate-800 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium w-full sm:w-auto"
                >
                  Stop
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-slate-900">Manual code</h2>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste QR payload or unique ID"
              className="w-full border border-slate-200 rounded-lg px-3 py-3 sm:py-2 text-sm"
            />
            <button
              type="button"
              onClick={submitCode}
              className="w-full sm:w-auto bg-slate-900 text-white px-4 py-3 sm:py-2 rounded-lg text-sm font-medium"
            >
              Check in with code
            </button>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Search size={18} />
                Search
              </h2>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, email, roll, or code"
                className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-3 sm:py-2 text-sm"
              />
              <ul className="mt-3 space-y-2 max-h-56 overflow-y-auto">
                {results.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-sm border border-slate-100 rounded-lg p-3"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{a.name || "—"}</div>
                      <div className="text-slate-500 text-xs">{a.email}</div>
                      <div className="text-xs mt-1">
                        {a.checked_in ? (
                          <span className="text-emerald-700">Checked in</span>
                        ) : (
                          <span className="text-slate-500">Not checked in</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {a.checked_in ? (
                        <button
                          type="button"
                          onClick={() => uncheckIn({ attendee_id: a.id })}
                          className="inline-flex items-center justify-center gap-1 bg-rose-600 text-white px-3 py-2 sm:px-2 sm:py-1 rounded text-xs font-medium flex-1 sm:flex-initial"
                        >
                          <XCircle size={14} />
                          Uncheck
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => checkIn({ attendee_id: a.id })}
                          className="inline-flex items-center justify-center gap-1 bg-emerald-600 text-white px-3 py-2 sm:px-2 sm:py-1 rounded text-xs font-medium flex-1 sm:flex-initial"
                        >
                          <CheckCircle size={14} />
                          Check in
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <h2 className="font-semibold text-slate-900 text-sm">Last check-in logs</h2>

                {logs.length === 0 ? (
                  <p className="text-sm text-slate-600 mt-2">No logs yet.</p>
                ) : (
                  <ul className="mt-2 space-y-1">
                    {logs.map((l, i) => (
                      <li
                        key={l.attendee_id ? `${l.attendee_id}-${i}` : i}
                        className="text-sm text-slate-600"
                      >
                        <span className="font-medium text-slate-900">{l.name || "—"}</span>
                        :{" "}
                        {l.checked_in ? (
                          <span className="text-emerald-700">Checked in</span>
                        ) : (
                          <span className="text-slate-500">Unchecked</span>
                        )}
                        {l.checkin_time ? (
                          <span className="text-slate-500">
                            {" "}
                            ({new Date(l.checkin_time).toLocaleString()})
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {status && (
          <p className="mt-4 text-sm px-4 py-3 rounded-lg bg-slate-100 text-slate-800 break-words">
            {status}
          </p>
        )}
        {toast && (
          <div className="fixed top-4 right-4 z-50 pointer-events-none">
            <div
              className={`px-3 py-2 rounded-lg shadow-lg text-sm text-white ${
                toast.kind === "success"
                  ? "bg-emerald-600"
                  : toast.kind === "error"
                    ? "bg-rose-600"
                    : "bg-slate-900"
              }`}
            >
              {toast.message}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default EventCheckinPage;
