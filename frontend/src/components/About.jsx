function About() {

  return (

    <section className="py-20">

      <div className="max-w-6xl mx-auto px-4 md:px-6">

        <h2 className="text-3xl md:text-4xl font-bold text-blue-900 text-center">

          About GetEvents

        </h2>

        <p className="mt-6 text-gray-600 text-lg text-center max-w-3xl mx-auto">

          GetEvents helps organizations manage event registrations,

          attendee passes, and check-ins seamlessly.

          Whether hosting public or private events,

          everything stays organized in one place.

        </p>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold text-blue-700">Plan</p>
            <h3 className="mt-2 text-xl font-semibold">Create Event + Form</h3>
            <p className="mt-2 text-gray-600">Set event profile, audience visibility, and dynamic registration fields.</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold text-blue-700">Operate</p>
            <h3 className="mt-2 text-xl font-semibold">Import + Mail</h3>
            <p className="mt-2 text-gray-600">Upload attendees, map columns, and prepare pass/certificate mail workflows.</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <p className="text-sm font-semibold text-blue-700">Execute</p>
            <h3 className="mt-2 text-xl font-semibold">Check-in + Track</h3>
            <p className="mt-2 text-gray-600">Run QR/manual check-in and monitor attendance from dashboard analytics.</p>
          </div>
        </div>

      </div>

    </section>

  );

}

export default About;