import { Link }
from "react-router-dom";

function FormToolbar() {

  return (

    <div className="flex gap-4">

      <button className="bg-blue-600 text-white px-5 py-2 rounded">

        Save Form

      </button>

      <Link to="/dashboard/forms/preview">

        <button className="border px-5 py-2 rounded">

          Preview Form

        </button>

      </Link>

      <button className="bg-green-600 text-white px-5 py-2 rounded">

        Publish Form

      </button>

    </div>

  );

}

export default FormToolbar;