import { useEffect, useState }
from "react";

import DashboardLayout
from "../layouts/DashboardLayout";

import API
from "../services/api";
import { decodeJwtPayload } from "../utils/jwt";

import { Link }
from "react-router-dom";

function EventListDashboard() {

  const [events,
    setEvents] = useState([]);

  const [error,
    setError] = useState("");

  const token = localStorage.getItem("token");
  const claims = decodeJwtPayload(token);
  const organizationId = claims?.organization_id;
  const sessionError = !organizationId
    ? "Session details missing. Please log in again."
    : "";

  useEffect(() => {

    if (!organizationId) {
      return;
    }

    API.get("/events/list", {
      params: { organization_id: organizationId }
    })

      .then(res => {

        setEvents(res.data);

      })
      .catch(() => {
        setError("Failed to load events.");
      });

  }, [organizationId]);

  return (

    <DashboardLayout>

      <h2 className="text-2xl font-bold mb-6">

        Your Events

      </h2>

      {(sessionError || error) && (
        <p className="text-red-600 mb-4">{sessionError || error}</p>
      )}

      {!error && !sessionError && events.length === 0 && (
        <p className="text-gray-600">No events found yet.</p>
      )}

      <div className="grid md:grid-cols-3 gap-6">

        {events.map(event => (

          <Link

            key={event.id}

            to={`/dashboard/event/${event.id}`}

          >

            <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg">

              <img

                src={event.logo_url}
                alt={`${event.title} logo`}

                className="h-32 w-full object-cover rounded"

              />

              <h3 className="mt-3 font-semibold">

                {event.title}

              </h3>

              <p className="text-sm text-gray-500">

                {event.venue}

              </p>

            </div>

          </Link>

        ))}

      </div>

    </DashboardLayout>

  );

}

export default EventListDashboard;