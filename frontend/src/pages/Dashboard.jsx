import DashboardLayout from "../layouts/DashboardLayout";

import ProfileCard from "../components/ProfileCard";
import OrganizationCard from "../components/OrganizationCard";
import EventCard from "../components/EventCard";
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

      {/* Profile + Organization */}

      <div className="grid md:grid-cols-2 gap-6">

        <ProfileCard user={user} />

        <OrganizationCard organization={organization} />

      </div>

      {/* Actions */}

      {/* <div className="flex gap-4 mt-6">

        <button className="bg-blue-600 text-white px-5 py-2 rounded">

          Create Event

        </button>

        <button className="border px-5 py-2 rounded">

          Add User

        </button>

      </div> */}



        <div className="flex gap-4 mt-6 flex-wrap">

            <Link to="/dashboard/create-event">

                <button className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">

                    Create Event

                </button>

            </Link>

            <Link to="/dashboard/users">

                <button className="border px-5 py-2 rounded hover:bg-gray-100">

                    Add User

                </button>

            </Link>

            <Link to="/dashboard/events">

              <button className="border px-5 py-2 rounded hover:bg-gray-100">

                View Events

              </button>

            </Link>

        </div>




      {/* Event List */}

      <h3 className="text-xl font-semibold mt-8 mb-4">
        Events
      </h3>

      {events.length === 0 && !error && !sessionError && (
        <p className="text-gray-600 mb-4">No events created yet.</p>
      )}

      <div className="grid md:grid-cols-3 gap-6 mt-8">

        {events.map((event) => (

          <EventCard key={event.id} event={event} />

        ))}

      </div>

    </DashboardLayout>

  );

}

export default Dashboard;