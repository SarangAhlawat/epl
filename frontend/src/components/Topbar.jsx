import useAuth from "../hooks/useAuth";

function Topbar() {

  const { logout } = useAuth();

  return (

    <div className="bg-white shadow px-6 py-4 flex justify-between items-center">

      <h1 className="text-xl font-semibold text-blue-900">

        Dashboard

      </h1>

      <button

        onClick={logout}

        className="bg-red-500 text-white px-4 py-2 rounded"

      >

        Logout

      </button>

    </div>

  );

}

export default Topbar;