function EventStats({

  stats

}) {

  return (

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 w-full">

      <div className="bg-white p-5 rounded-xl shadow">

        <h3>Total Registered</h3>

        <p className="text-2xl font-bold">

          {stats.total_registered}

        </p>

      </div>

      <div className="bg-white p-5 rounded-xl shadow">

        <h3>Checked In</h3>

        <p className="text-2xl font-bold">

          {stats.checked_in}

        </p>

      </div>

      <div className="bg-white p-5 rounded-xl shadow">

        <h3>Pending</h3>

        <p className="text-2xl font-bold">

          {stats.pending}

        </p>

      </div>

    </div>

  );

}

export default EventStats;