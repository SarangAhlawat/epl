import { useState }
from "react";

import { useNavigate }
from "react-router-dom";

import API from "../services/api";
import { sendOTP }
from "../services/auth";

function Signup() {

  const navigate = useNavigate();

  const [form,
    setForm] = useState({

    name: "",
    email: "",
    password: ""

  });

  const handleChange = (e) => {

    setForm({

      ...form,

      [e.target.name]:
        e.target.value

    });

  };

  const handleSubmit =
  async () => {

    // Create organization

    await API.post(

      "/admin/create-organization",

      null,

      {

        params: {

          name: form.name,

          email: form.email,

          password:
            form.password

        }

      }

    );

    // Send OTP

    await sendOTP(form.email);

    // Go verify page

    navigate("/verify", {

      state: {

        email: form.email

      }

    });

  };

  return (

    <div className="flex justify-center items-center h-screen bg-slate-50">

      <div className="bg-white shadow-xl p-8 rounded-xl w-96">

        <h2 className="text-2xl font-bold text-blue-900 mb-6">

          Create Organization

        </h2>

        <input

          name="name"

          placeholder="Organization Name"

          onChange={handleChange}

          className="border p-2 w-full mb-3 rounded"

        />

        <input

          name="email"

          placeholder="Admin Email"

          onChange={handleChange}

          className="border p-2 w-full mb-3 rounded"

        />

        <input

          type="password"

          name="password"

          placeholder="Password"

          onChange={handleChange}

          className="border p-2 w-full mb-4 rounded"

        />

        <button

          onClick={handleSubmit}

          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"

        >

          Create Organization

        </button>

      </div>

    </div>

  );

}

export default Signup;