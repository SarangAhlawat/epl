import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import API from "../services/api";

function PublicEventsPage() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/events/list")
      .then((res) => {
        const publicEvents = (res.data || []).filter((event) => event.is_public);
        setEvents(publicEvents);
      })
      .catch(() => {
        setError("Failed to load public events.");
      });
  }, []);

  return (
    <MainLayout>
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-blue-900">Public Events</h1>
        <p className="mt-2 text-gray-600">Discover open events and register in minutes.</p>

        {error && <p className="mt-6 text-red-600">{error}</p>}

        {!error && events.length === 0 && (
          <p className="mt-6 text-gray-600">No public events available yet.</p>
        )}

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow p-5 border border-slate-100">
              <img
                src={event.logo_url}
                alt={`${event.title} logo`}
                className="h-40 w-full object-cover rounded"
              />
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{event.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{event.venue}</p>
              <p className="text-sm text-gray-500 mt-1">
                {event.date ? new Date(event.date).toLocaleString() : "Date TBA"}
              </p>
              <Link
                to={`/events/${event.id}/register`}
                className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded"
              >
                Register
              </Link>
            </div>
          ))}
        </div>
      </section>
    </MainLayout>
  );
}

export default PublicEventsPage;
