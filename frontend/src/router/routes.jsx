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

import FormBuilder
from "../pages/FormBuilder";

import FormPreview
from "../pages/FormPreview";

import ExcelUpload from "../pages/ExcelUpload";

import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import EventListDashboard from "../pages/EventListDashboard";
import EventCreate from "../pages/EventCreate";
import EventDetailDashboard from "../pages/EventDetailDashboard";

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

        <Route

          path="/dashboard"

          element={

            <ProtectedRoute>

              <Dashboard />

            </ProtectedRoute>

          }

        />




        <Route
          path="/dashboard/events"
          element={
            <ProtectedRoute>
            <EventListDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/create-event"
          element={
            <ProtectedRoute>
            <EventCreate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/event/:eventId"
          element={
            <ProtectedRoute>
            <EventDetailDashboard />
            </ProtectedRoute>
          }
        />


        <Route

          path="/dashboard/forms"

          element={

            <ProtectedRoute>

            <FormBuilder />

            </ProtectedRoute>

          }

        />

        <Route

          path="/dashboard/forms/preview"

          element={

            <ProtectedRoute>

            <FormPreview />

            </ProtectedRoute>

          }

        />

        <Route
          path="/dashboard/events/:eventId/excel"
          element={<ExcelUpload />}
        />

      </Routes>

    </BrowserRouter>

  );

}

export default AppRoutes;