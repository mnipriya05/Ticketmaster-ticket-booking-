import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EventsPage from "./pages/EventsPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import BookingPage from "./pages/BookingPage";
import TicketPage from "./pages/TicketPage";
import BookingHistoryPage from "./pages/BookingHistoryPage";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage />}
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        path="/events"
        element={<EventsPage />}
      />

      <Route
        path="/events/:eventId"
        element={<EventDetailsPage />}
      />

      <Route
        path="/bookings/:bookingId"
        element={<BookingPage />}
      />

      <Route
        path="/tickets/:bookingId"
        element={<TicketPage />}
      />

      <Route
        path="/booking-history"
        element={<BookingHistoryPage />}
      />
    </Routes>
  );
}

export default App;