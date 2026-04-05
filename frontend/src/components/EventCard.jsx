function EventCard() {

  return (

    <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg transition">

      <h3 className="font-semibold">

        Event Title

      </h3>

      <p className="text-gray-500 text-sm">

        Total Registered: 120

      </p>

      <button className="mt-3 text-blue-600 font-medium">

        View Details →

      </button>

    </div>

  );

}

export default EventCard;