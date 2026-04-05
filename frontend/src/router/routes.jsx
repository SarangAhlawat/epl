import {

  BrowserRouter,
  Routes,
  Route

} from "react-router-dom";

import Landing
from "../pages/Landing";

import Login
from "../pages/Login";

import Signup
from "../pages/Signup";

import VerifyOTP
from "../pages/VerifyOTP";

function AppRoutes() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Landing />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/verify"
          element={<VerifyOTP />}
        />

      </Routes>

    </BrowserRouter>

  );

}

export default AppRoutes;