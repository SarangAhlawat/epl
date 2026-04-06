import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import API from "../services/api";
import { ArrowLeft } from "lucide-react";

function EventMailingQrPage() {

  const { eventId } = useParams();

  const [busy, setBusy] = useState(false);

  const [msg, setMsg] = useState("");

  const [log, setLog] = useState([]);

  const run = async () => {

    setBusy(true);

    setMsg("");

    setLog([]);

    try {

      const res = await API.post(`/events/${eventId}/mailing/generate-qr`);

      setLog(res.data.log || []);

      setMsg(`QR images generated: ${res.data.generated}`);

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

        {msg && <p className="mt-4 text-sm text-slate-700">{msg}</p>}

        {log.length > 0 && (

          <div className="mt-4 bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono max-h-48 overflow-y-auto">

            {log.map((line, i) => (

              <div key={i}>{line}</div>

            ))}

          </div>

        )}

      </div>

    </DashboardLayout>

  );

}

export default EventMailingQrPage;
