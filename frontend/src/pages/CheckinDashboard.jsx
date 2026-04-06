import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

function CheckinDashboard() {
  const [query, setQuery] = useState("");

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold">Check-in System</h1>
      <p className="text-gray-600 mt-2">Run QR scan and manual attendee check-in from one place.</p>

      <div className="mt-6 grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold">QR Scanner</h2>
          <p className="text-gray-600 mt-2">Open camera scanner and validate attendee passes.</p>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Open Scanner</button>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold">Manual Search</h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search attendee name / roll / email"
            className="mt-3 border p-2 rounded w-full"
          />
          <button className="mt-4 bg-slate-800 text-white px-4 py-2 rounded">Find Attendee</button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default CheckinDashboard;
