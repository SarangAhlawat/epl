import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function PublicEvents() {

  const [events, setEvents] = useState([]);

  useEffect(() => {
    API.get("/events/list")
      .then((res) => {
        const publicEvents = (res.data || [])
          .filter((event) => event.is_public)
          .slice(0, 3);
        setEvents(publicEvents);
      })
      .catch(() => {
        setEvents([]);
      });
  }, []);

  return (

    <section className="bg-white py-20">

      <div className="max-w-7xl mx-auto px-4 md:px-6">

        <h2 className="text-3xl md:text-4xl font-bold text-blue-900 text-center">

          Explore Public Events

        </h2>

        <p className="text-center text-gray-600 mt-3">

          Discover and register for upcoming events.

        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-10">

          {events.map((event) => (

            <Link

              key={event.id}
              to={`/events/${event.id}/register`}
              className="border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition block"

            >

              <img src={event.logo_url} alt={`${event.title} logo`} className="h-44 w-full object-cover rounded-xl" />

              <h3 className="mt-4 font-semibold text-slate-900">

                {event.title}

              </h3>

              <p className="text-gray-500 text-sm">

                {event.venue}

              </p>

              <div className="mt-4 text-blue-700 font-semibold text-sm">
                Register now {"->"}
              </div>

            </Link>

          ))}

          {events.length === 0 && (
            <p className="text-gray-600">No public events yet.</p>
          )}

        </div>

      </div>

    </section>

  );

}

export default PublicEvents;