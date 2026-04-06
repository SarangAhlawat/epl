import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import { ArrowLeft, Search, CheckCircle } from "lucide-react";

function EventCheckinPage() {

  const { eventId } = useParams();

  const [query, setQuery] = useState("");

  const [results, setResults] = useState([]);

  const [code, setCode] = useState("");

  const [status, setStatus] = useState("");

  const [scanning, setScanning] = useState(false);

  const videoRef = useRef(null);

  const streamRef = useRef(null);

  const rafRef = useRef(null);

  const scanningRef = useRef(false);

  const search = useCallback(() => {

    API.get(`/events/${eventId}/attendees/search`, { params: { q: query } }).then(

      (res) => {

        setResults(Array.isArray(res.data) ? res.data : []);

      }

    );

  }, [eventId, query]);

  useEffect(() => {

    const t = setTimeout(search, 250);

    return () => clearTimeout(t);

  }, [query, search]);

  const checkIn = async (payload) => {

    setStatus("");

    try {

      const res = await API.post(`/events/${eventId}/check-in`, payload);

      setStatus(`Checked in: ${res.data.name || res.data.attendee_id}`);

      setQuery("");

      setResults([]);

      setCode("");

    } catch (e) {

      const d = e.response?.data?.detail;

      setStatus(typeof d === "string" ? d : "Check-in failed.");

    }

  };

  const parseQrPayload = (raw) => {

    const s = String(raw || "").trim();

    if (!s) return null;

    const parts = s.split("|");

    if (parts.length === 2 && parts[0] && parts[1]) {

      return { unique_id: parts[1].trim() };

    }

    return { unique_id: s };

  };

  const stopScanner = () => {

    scanningRef.current = false;

    setScanning(false);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = null;

    if (streamRef.current) {

      streamRef.current.getTracks().forEach((t) => t.stop());

      streamRef.current = null;

    }

    if (videoRef.current) videoRef.current.srcObject = null;

  };

  const startScanner = async () => {

    if (!("BarcodeDetector" in window)) {

      setStatus("Camera QR is not supported in this browser. Paste a code or search.");

      return;

    }

    try {

      const stream = await navigator.mediaDevices.getUserMedia({

        video: { facingMode: "environment" }

      });

      streamRef.current = stream;

      if (videoRef.current) {

        videoRef.current.srcObject = stream;

        await videoRef.current.play();

      }

      scanningRef.current = true;

      setScanning(true);

      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

      const tick = async () => {

        if (!scanningRef.current || !videoRef.current) return;

        try {

          const codes = await detector.detect(videoRef.current);

          if (codes.length > 0) {

            const parsed = parseQrPayload(codes[0].rawValue);

            if (parsed?.unique_id) {

              stopScanner();

              await checkIn(parsed);

              return;

            }

          }

        } catch {

          /* ignore frame errors */

        }

        rafRef.current = requestAnimationFrame(tick);

      };

      rafRef.current = requestAnimationFrame(tick);

    } catch {

      setStatus("Could not access camera.");

    }

  };

  useEffect(() => {

    return () => stopScanner();

  }, []);

  const submitCode = () => {

    const parsed = parseQrPayload(code);

    if (parsed?.unique_id) checkIn(parsed);

    else setStatus("Enter a valid check-in code.");

  };

  return (

    <DashboardLayout>

      <div className="max-w-3xl">

        <Link

          to={`/dashboard/event/${eventId}`}

          className="inline-flex items-center gap-2 text-sm text-slate-600 mb-6"

        >

          <ArrowLeft size={16} />

          Event hub

        </Link>

        <h1 className="text-2xl font-bold text-slate-900">Check-in scan</h1>

        <p className="text-slate-600 mt-2 text-sm">

          Scan a QR from this event, paste the raw payload, or search and check in. The

          attendee table updates the checked-in column.

        </p>

        <div className="mt-6 grid md:grid-cols-2 gap-6">

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">

            <h2 className="font-semibold text-slate-900">QR scanner</h2>

            <p className="text-xs text-slate-500 mt-1">

              Uses the browser barcode API (Chrome / Edge). Grant camera permission when

              prompted.

            </p>

            <div className="mt-4 rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">

              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

            </div>

            <div className="flex gap-2 mt-4">

              {!scanning ? (

                <button

                  type="button"

                  onClick={startScanner}

                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"

                >

                  Start camera

                </button>

              ) : (

                <button

                  type="button"

                  onClick={stopScanner}

                  className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium"

                >

                  Stop

                </button>

              )}

            </div>

          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">

            <h2 className="font-semibold text-slate-900">Manual code</h2>

            <input

              value={code}

              onChange={(e) => setCode(e.target.value)}

              placeholder="Paste QR payload or unique ID"

              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"

            />

            <button

              type="button"

              onClick={submitCode}

              className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium"

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

                className="mt-2 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"

              />

              <ul className="mt-3 space-y-2 max-h-56 overflow-y-auto">

                {results.map((a) => (

                  <li

                    key={a.id}

                    className="flex justify-between items-center gap-2 text-sm border border-slate-100 rounded-lg p-2"

                  >

                    <div>

                      <div className="font-medium text-slate-900">{a.name || "—"}</div>

                      <div className="text-slate-500 text-xs">{a.email}</div>

                    </div>

                    <button

                      type="button"

                      onClick={() => checkIn({ attendee_id: a.id })}

                      className="shrink-0 inline-flex items-center gap-1 bg-emerald-600 text-white px-2 py-1 rounded text-xs font-medium"

                    >

                      <CheckCircle size={14} />

                      In

                    </button>

                  </li>

                ))}

              </ul>

            </div>

          </div>

        </div>

        {status && (

          <p className="mt-4 text-sm px-4 py-3 rounded-lg bg-slate-100 text-slate-800">

            {status}

          </p>

        )}

      </div>

    </DashboardLayout>

  );

}

export default EventCheckinPage;
