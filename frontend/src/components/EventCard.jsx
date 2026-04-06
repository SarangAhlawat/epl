import { Link } from "react-router-dom";

function EventCard({
  event
}) {

  if (!event) {
    return null;
  }

  const formattedDate = event.date
    ? new Date(event.date).toLocaleString()
    : "Date not set";

  return (

    <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">

      <h3 className="font-semibold">

        {event.title}

      </h3>

      <p className="text-gray-500 text-sm mt-1">
        {event.venue || "Venue not set"}
      </p>

      <p className="text-gray-500 text-sm">

        {formattedDate}

      </p>

      <Link
        to={`/dashboard/event/${event.id}`}
        className="mt-3 inline-block text-blue-600 font-medium"
      >
        View Details →
      </Link>

    </div>

  );

}

export default EventCard;