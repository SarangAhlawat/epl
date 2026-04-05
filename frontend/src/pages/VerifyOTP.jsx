import { useState }
from "react";

import {

  useNavigate,
  useLocation

}

from "react-router-dom";

import {

  verifyOTP,
  loginOTP

}

from "../services/auth";

import useAuth
from "../hooks/useAuth";

function VerifyOTP() {

  const navigate = useNavigate();

  const location = useLocation();

  const { login } = useAuth();

  const email =
    location.state?.email;

  const [otp,
    setOtp] = useState("");

  const handleVerify =
  async () => {

    await verifyOTP(
      email,
      otp
    );

    const res =
      await loginOTP(
        email,
        otp
      );

    login(
      res.data.access_token
    );

    navigate("/dashboard");

  };

  return (

    <div className="flex justify-center items-center h-screen bg-slate-50">

      <div className="bg-white p-8 shadow-xl rounded-xl w-96">

        <h2 className="text-xl font-bold mb-4">

          Verify OTP

        </h2>

        <p className="text-sm text-gray-500 mb-3">

          OTP sent to {email}

        </p>

        <input

          placeholder="Enter OTP"

          onChange={e =>
            setOtp(
              e.target.value
            )}

          className="border p-2 w-full mb-4 rounded"

        />

        <button

          onClick={handleVerify}

          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"

        >

          Verify & Continue

        </button>

      </div>

    </div>

  );

}

export default VerifyOTP;