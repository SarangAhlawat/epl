import DashboardLayout from "../layouts/DashboardLayout";

import ProfileCard from "../components/ProfileCard";
import OrganizationCard from "../components/OrganizationCard";
import EventCard from "../components/EventCard";
import { Link } from "react-router-dom";

function Dashboard() {

  return (

    <DashboardLayout>

      {/* Profile + Organization */}

      <div className="grid md:grid-cols-2 gap-6">

        <ProfileCard />

        <OrganizationCard />

      </div>

      {/* Actions */}

      {/* <div className="flex gap-4 mt-6">

        <button className="bg-blue-600 text-white px-5 py-2 rounded">

          Create Event

        </button>

        <button className="border px-5 py-2 rounded">

          Add User

        </button>

      </div> */}



        <div className="flex gap-4 mt-6">

            <Link to="/dashboard/create-event">

                <button className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700">

                    Create Event

                </button>

            </Link>

            <Link to="/dashboard">

                <button className="border px-5 py-2 rounded hover:bg-gray-100">

                    Add User

                </button>

            </Link>

        </div>




      {/* Event List */}

      <div className="grid md:grid-cols-3 gap-6 mt-8">

        {[1,2,3].map(i => (

          <EventCard key={i} />

        ))}

      </div>

    </DashboardLayout>

  );

}

export default Dashboard;