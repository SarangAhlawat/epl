function PublicEvents() {

  return (

    <section className="bg-white py-20">

      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-3xl font-bold text-blue-900 text-center">

          Explore Public Events

        </h2>

        <p className="text-center text-gray-600 mt-3">

          Discover and register for upcoming events.

        </p>

        {/* Placeholder cards */}

        <div className="grid md:grid-cols-3 gap-6 mt-10">

          {[1,2,3].map(i => (

            <div

              key={i}

              className="border rounded-xl p-5 shadow hover:shadow-lg transition"

            >

              <div className="h-40 bg-gray-200 rounded" />

              <h3 className="mt-4 font-semibold">

                Event Title

              </h3>

              <p className="text-gray-500 text-sm">

                Venue | Date

              </p>

            </div>

          ))}

        </div>

      </div>

    </section>

  );

}

export default PublicEvents;