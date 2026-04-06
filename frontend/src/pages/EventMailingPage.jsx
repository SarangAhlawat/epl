import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import { FileImage, Mail, QrCode, ArrowLeft } from "lucide-react";

const cardClass =

  "block bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition group";

function EventMailingPage() {

  const { eventId } = useParams();

  const base = `/dashboard/event/${eventId}/mailing`;

  return (

    <DashboardLayout>

      <div className="max-w-4xl">

        <Link

          to={`/dashboard/event/${eventId}`}

          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"

        >

          <ArrowLeft size={16} />

          Back to event

        </Link>

        <h1 className="text-2xl font-bold text-slate-900">Mailing & passes</h1>

        <p className="text-slate-600 mt-2 text-sm max-w-2xl">

          Generate personalized passes from a template and merge fields, create QR codes

          for check-in, and run email campaigns. Status columns update on the attendee

          table for each recipient.

        </p>

        <div className="grid md:grid-cols-3 gap-5 mt-8">

          <Link to={`${base}/passes`} className={cardClass}>

            <FileImage

              className="text-blue-600 group-hover:scale-105 transition"

              size={28}

            />

            <h2 className="mt-4 font-semibold text-slate-900">Generate passes</h2>

            <p className="text-sm text-slate-600 mt-2">

              Upload a pass template and merge attendee fields into HTML passes stored per

              attendee.

            </p>

          </Link>

          <Link to={`${base}/qr`} className={cardClass}>

            <QrCode

              className="text-violet-600 group-hover:scale-105 transition"

              size={28}

            />

            <h2 className="mt-4 font-semibold text-slate-900">Generate QR</h2>

            <p className="text-sm text-slate-600 mt-2">

              Build QR codes from attendee IDs and save them for mailing or desk check-in.

            </p>

          </Link>

          <Link to={`${base}/send`} className={cardClass}>

            <Mail

              className="text-emerald-600 group-hover:scale-105 transition"

              size={28}

            />

            <h2 className="mt-4 font-semibold text-slate-900">Mails</h2>

            <p className="text-sm text-slate-600 mt-2">

              Compose HTML, optionally attach pass links, send to all attendees, and review

              logs.

            </p>

          </Link>

        </div>

      </div>

    </DashboardLayout>

  );

}

export default EventMailingPage;
