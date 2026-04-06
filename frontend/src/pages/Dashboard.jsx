import DashboardLayout from "../layouts/DashboardLayout";

import ProfileCard from "../components/ProfileCard";
import OrganizationCard from "../components/OrganizationCard";
import EventCard from "../components/EventCard";
import ServicesStatus from "../components/ServicesStatus";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { decodeJwtPayload } from "../utils/jwt";

function Dashboard() {

  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const claims = decodeJwtPayload(token);
  const userId = claims?.user_id;
  const organizationId = claims?.organization_id;
  const sessionError = (!userId || !organizationId)
    ? "Session details missing. Please log in again."
    : "";

  useEffect(() => {

    if (!userId || !organizationId) {
      return;
    }

    API.get(`/users/${userId}`)
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        setError("Failed to load user profile.");
      });

    API.get(`/users/organization/${organizationId}`)
      .then((res) => {
        setOrganization(res.data);
      })
      .catch(() => {
        setError("Failed to load organization.");
      });

    API.get("/events/list", {
      params: { organization_id: organizationId }
    })
      .then((res) => {
        setEvents(res.data);
      })
      .catch(() => {
        setError("Failed to load events.");
      });

  }, [userId, organizationId]);

  return (

    <DashboardLayout>

      {(sessionError || error) && (
        <p className="text-red-600 mb-4">{sessionError || error}</p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-900 to-slate-900 text-white p-5 sm:p-8 mb-6 sm:mb-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">Welcome</p>
        <h1 className="text-2xl sm:text-3xl font-bold mt-2">Event dashboard</h1>
        <p className="text-slate-200 mt-2 text-sm sm:text-base max-w-2xl">
          Manage events, attendees, forms, mailing, and check-in. Open an event from the list below
          for the full command center.
        </p>
      </div>

      <div className="mb-6 sm:mb-8">
        <ServicesStatus />
      </div>

      {/* Profile + Organization */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

        <ProfileCard user={user} />

        <OrganizationCard organization={organization} />

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 sm:mt-8">

            <Link to="/dashboard/create-event" className="block">

                <span className="flex w-full items-center justify-center bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 text-sm font-semibold shadow-sm">

                    Create Event

                </span>

            </Link>

            <Link to="/dashboard/users" className="block">

                <span className="flex w-full items-center justify-center border border-slate-200 bg-white px-5 py-3 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-800">

                    Add User

                </span>

            </Link>

            <Link to="/dashboard/events" className="block sm:col-span-1">

              <span className="flex w-full items-center justify-center border border-slate-200 bg-white px-5 py-3 rounded-xl hover:bg-slate-50 text-sm font-semibold text-slate-800">

                View Events

              </span>

            </Link>

        </div>

      {/* Event List */}

      <h3 className="text-lg sm:text-xl font-semibold mt-8 sm:mt-10 mb-3 sm:mb-4 text-slate-900">
        Your events
      </h3>

      {events.length === 0 && !error && !sessionError && (
        <p className="text-gray-600 mb-4">No events created yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">

        {events.map((event) => (

          <EventCard key={event.id} event={event} />

        ))}

      </div>

    </DashboardLayout>

  );

}

export default Dashboard;