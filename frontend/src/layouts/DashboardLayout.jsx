import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function DashboardLayout({ children }) {

  return (

    <div className="flex min-h-screen bg-slate-50">

      <Sidebar />

      <div className="flex-1">

        <Topbar />

        <div className="p-6 md:p-8">

          <div className="max-w-7xl mx-auto">

            {children}

          </div>

        </div>

      </div>

    </div>

  );

}

export default DashboardLayout;