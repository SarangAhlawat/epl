import { useEffect, useState }
from "react";

import API from "../services/api";

function EventList() {

  const [events, setEvents] =
    useState([]);

  useEffect(() => {

    API.get("/events/list")

      .then(res => {

        setEvents(res.data);

      });

  }, []);

  return (

    <div className="p-8">

      <h1 className="text-3xl font-bold mb-6">

        Available Events

      </h1>

      <div className="grid md:grid-cols-3 gap-6">

        {events.map(event => (

          <a

            key={event.id}

            href={`/event/${event.id}`}

            className="border rounded-xl p-4 shadow"

          >

            <img

              src={event.logo_url}

              className="w-full h-40 object-cover rounded"

            />

            <h2 className="text-xl font-semibold mt-2">

              {event.title}

            </h2>

            <p className="text-gray-600">

              {event.venue}

            </p>

          </a>

        ))}

      </div>

    </div>

  );
}

export default EventList;