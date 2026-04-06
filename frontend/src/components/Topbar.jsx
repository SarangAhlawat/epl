import useAuth from "../hooks/useAuth";
import { Menu } from "lucide-react";

function Topbar({ onMenuToggle, showMenuButton = false }) {

  const { logout } = useAuth();

  return (

    <div className="bg-white shadow px-4 sm:px-6 py-4 flex justify-between items-center gap-3 sticky top-0 z-30">

      <div className="flex items-center gap-3 min-w-0">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
        )}
        <h1 className="text-lg sm:text-xl font-semibold text-blue-900 truncate">

          Dashboard

        </h1>
      </div>

      <button

        onClick={logout}

        className="bg-red-500 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base"

      >

        Logout

      </button>

    </div>

  );

}

export default Topbar;