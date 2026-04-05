import {

  LayoutDashboard,
  Calendar,
  Users,
  Upload,
  Mail,
  QrCode

} from "lucide-react";

import { Link } from "react-router-dom";

function Sidebar() {

  return (

    <div className="w-64 bg-blue-900 text-white min-h-screen p-6">

      <h2 className="text-xl font-bold mb-10">

        GetEvents

      </h2>

      <nav className="flex flex-col gap-5">

        <Link
          to="/dashboard"
          className="flex items-center gap-3 hover:text-blue-200"
        >

          <LayoutDashboard size={18} />

          Dashboard

        </Link>

        <Link
          to="/dashboard/events"
          className="flex items-center gap-3 hover:text-blue-200"
        >

          <Calendar size={18} />

          Events

        </Link>

        <Link
          to="/dashboard"
          className="flex items-center gap-3 hover:text-blue-200"
        >

          <Users size={18} />

          Users

        </Link>

        <Link
          to="/dashboard/events"
          className="flex items-center gap-3 hover:text-blue-200"
        >

          <Upload size={18} />

          Upload Excel

        </Link>

        <Link
          to="/dashboard"
          className="flex items-center gap-3 hover:text-blue-200"
        >

          <Mail size={18} />

          Mailing

        </Link>

        <Link
          to="/dashboard"
          className="flex items-center gap-3 hover:text-blue-200"
        >

          <QrCode size={18} />

          Check-in

        </Link>

        <Link
            to="/dashboard/forms"
            className="flex items-center gap-3 hover:text-blue-200"
        >

 Forms

</Link>

      </nav>

    </div>

  );

}

export default Sidebar;