import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import VerifyOTP from "../pages/VerifyOTP";
import ExcelUpload from "../pages/ExcelUpload";
import AboutPage from "../pages/AboutPage";
import HowToUse from "../pages/HowToUse";
import PublicEventsPage from "../pages/PublicEventsPage";
import PublicEventRegister from "../pages/PublicEventRegister";
import UsersDashboard from "../pages/UsersDashboard";

import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "../components/ProtectedRoute";
import EventListDashboard from "../pages/EventListDashboard";
import EventCreate from "../pages/EventCreate";
import EventDetailDashboard from "../pages/EventDetailDashboard";
import EventFormsPage from "../pages/EventFormsPage";
import EventFormPreviewPage from "../pages/EventFormPreviewPage";
import EventMailingPage from "../pages/EventMailingPage";
import EventMailingPassesPage from "../pages/EventMailingPassesPage";
import EventMailingQrPage from "../pages/EventMailingQrPage";
import EventMailingSendPage from "../pages/EventMailingSendPage";
import EventCheckinPage from "../pages/EventCheckinPage";

function AppRoutes() {

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Landing />} />

        <Route path="/login" element={<Login />} />

        <Route path="/about" element={<AboutPage />} />

        <Route path="/how-to-use" element={<HowToUse />} />

        <Route path="/events" element={<PublicEventsPage />} />

        <Route path="/events/:eventId/register" element={<PublicEventRegister />} />

        <Route path="/signup" element={<Signup />} />

        <Route path="/verify" element={<VerifyOTP />} />

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

          path="/dashboard/event/:eventId/forms"

          element={

            <ProtectedRoute>

              <EventFormsPage />

            </ProtectedRoute>

          }

        />

        <Route

          path="/dashboard/event/:eventId/forms/preview"

          element={

            <ProtectedRoute>

              <EventFormPreviewPage />

            </ProtectedRoute>

          }

        />

        <Route

          path="/dashboard/event/:eventId/mailing"

          element={

            <ProtectedRoute>

              <EventMailingPage />

            </ProtectedRoute>

          }

        />

        <Route

          path="/dashboard/event/:eventId/mailing/passes"

          element={

            <ProtectedRoute>

              <EventMailingPassesPage />

            </ProtectedRoute>

          }

        />

        <Route

          path="/dashboard/event/:eventId/mailing/qr"

          element={

            <ProtectedRoute>

              <EventMailingQrPage />

            </ProtectedRoute>

          }

        />

        <Route

          path="/dashboard/event/:eventId/mailing/send"

          element={

            <ProtectedRoute>

              <EventMailingSendPage />

            </ProtectedRoute>

          }

        />

        <Route

          path="/dashboard/event/:eventId/checkin"

          element={

            <ProtectedRoute>

              <EventCheckinPage />

            </ProtectedRoute>

          }

        />

        <Route

          path="/dashboard/users"

          element={

            <ProtectedRoute>

              <UsersDashboard />

            </ProtectedRoute>

          }

        />

        <Route

          path="/dashboard/events/:eventId/excel"

          element={

            <ProtectedRoute>

              <ExcelUpload />

            </ProtectedRoute>

          }

        />

        <Route

          path="/dashboard/mailing"

          element={

            <ProtectedRoute>

              <Navigate to="/dashboard/events" replace />

            </ProtectedRoute>

          }

        />

        <Route

          path="/dashboard/checkin"

          element={

            <ProtectedRoute>

              <Navigate to="/dashboard/events" replace />

            </ProtectedRoute>

          }

        />

        <Route

          path="/dashboard/forms"

          element={

            <ProtectedRoute>

              <Navigate to="/dashboard/events" replace />

            </ProtectedRoute>

          }

        />

        <Route

          path="/dashboard/forms/preview"

          element={

            <ProtectedRoute>

              <Navigate to="/dashboard/events" replace />

            </ProtectedRoute>

          }

        />

      </Routes>

    </BrowserRouter>

  );

}

export default AppRoutes;
