import { useEffect, useState }
from "react";

import { useParams }
from "react-router-dom";
import { Link }
from "react-router-dom";

import DashboardLayout
from "../layouts/DashboardLayout";

import API
from "../services/api";

import EventStats
from "../components/EventStats";

function EventDetailDashboard() {

  const { eventId } =
    useParams();

  const [event,
    setEvent] = useState(null);

  const [stats,
    setStats] = useState(null);

  const [error,
    setError] = useState("");

  useEffect(() => {

    API.get(`/events/${eventId}`)

      .then(res => {

        if (res.data?.status === "event_not_found") {
          setError("Event not found.");
          return;
        }

        setError("");

        setEvent(res.data);

      })
      .catch(() => {
        setError("Failed to load event details.");
      });

    API.get(
      `/events/${eventId}/stats`
    )

      .then(res => {

        setError("");

        setStats(res.data);

      })
      .catch(() => {
        setError("Failed to load event stats.");
      });

  }, [eventId]);

  if (error) {
    return (
      <DashboardLayout>
        <p className="text-red-600">{error}</p>
      </DashboardLayout>
    );
  }

  if (!event || !stats)
    return <p>Loading...</p>;

  return (

    <DashboardLayout>

      <img

        src={event.logo_url}

        className="h-48 w-full object-cover rounded"

      />

      <h2 className="text-2xl font-bold mt-4">

        {event.title}

      </h2>

      <p className="text-gray-600">

        {event.description}

      </p>

      <div className="mt-6">

        <EventStats stats={stats} />

      </div>

      <Link
        to={`/dashboard/events/${event.id}/excel`}
        className="inline-block bg-green-600 text-white px-4 py-2 rounded"
      >
        Upload Excel
      </Link>

    </DashboardLayout>

  );

}

export default EventDetailDashboard;