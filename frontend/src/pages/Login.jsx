import { useState }
from "react";

import { useNavigate }
from "react-router-dom";

import useAuth
from "../hooks/useAuth";

import {

  loginPassword,
  sendOTP

}

from "../services/auth";

function Login() {

  const navigate = useNavigate();

  const { login } = useAuth();

  const [email,
    setEmail] = useState("");

  const [password,
    setPassword] = useState("");

  // Password Login

  const handlePasswordLogin =
  async () => {

    const res =
      await loginPassword(
        email,
        password
      );

    login(
      res.data.access_token
    );

    navigate("/dashboard");

  };

  // OTP Login

  const handleOTPLogin =
  async () => {

    await sendOTP(email);

    navigate(

      "/verify",

      {

        state: { email }

      }

    );

  };

  return (

    <div className="flex justify-center items-center h-screen bg-slate-50">

      <div className="bg-white p-8 shadow-xl rounded-xl w-96">

        <h2 className="text-2xl font-bold mb-6">

          Login

        </h2>

        <input

          placeholder="Email"

          onChange={e =>
            setEmail(
              e.target.value
            )}

          className="border p-2 w-full mb-3 rounded"

        />

        <input

          type="password"

          placeholder="Password"

          onChange={e =>
            setPassword(
              e.target.value
            )}

          className="border p-2 w-full mb-4 rounded"

        />

        {/* Password Login */}

        <button

          onClick={handlePasswordLogin}

          className="bg-blue-600 text-white w-full py-2 rounded mb-3 hover:bg-blue-700"

        >

          Login with Password

        </button>

        {/* OTP Login */}

        <button

          onClick={handleOTPLogin}

          className="border w-full py-2 rounded hover:bg-gray-100"

        >

          Login with OTP

        </button>

      </div>

    </div>

  );

}

export default Login;