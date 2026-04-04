import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import EventList from "../pages/EventList";
import EventDetail from "../pages/EventDetail";

function AppRoutes() {

  return (

    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<EventList />}
        />

        <Route
          path="/event/:eventId"
          element={<EventDetail />}
        />

      </Routes>

    </BrowserRouter>

  );
}

export default AppRoutes;