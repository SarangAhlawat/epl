import { LayoutDashboard, Calendar, Users, Upload } from "lucide-react";

import { NavLink } from "react-router-dom";

const navItemClass = ({ isActive }) =>

  `flex items-center gap-3 px-3 py-2 rounded-lg transition ${

    isActive ? "bg-blue-800 text-white" : "text-blue-100 hover:bg-blue-800"

  }`;

function Sidebar() {

  return (

    <aside className="w-64 shrink-0 bg-blue-900 text-white min-h-screen p-6">

      <h2 className="text-xl font-bold mb-10">GetEvents</h2>

      <nav className="flex flex-col gap-2">

        <NavLink to="/dashboard" className={navItemClass} end>

          <LayoutDashboard size={18} />

          Dashboard

        </NavLink>

        <NavLink to="/dashboard/events" className={navItemClass}>

          <Calendar size={18} />

          Events

        </NavLink>

        <NavLink to="/dashboard/users" className={navItemClass}>

          <Users size={18} />

          Users

        </NavLink>

        <NavLink to="/dashboard/events" className={navItemClass} title="Pick an event, then use Upload Excel on the event page">

          <Upload size={18} />

          Upload Excel

        </NavLink>

      </nav>

      <p className="mt-10 text-xs text-blue-200/80 leading-relaxed">

        Forms, mailing, and check-in live inside each event. Open{" "}

        <span className="text-white font-medium">Events</span>, choose an event, then use

        the workflow cards on the event hub.

      </p>

    </aside>

  );

}

export default Sidebar;
