import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

function BookingHistoryPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBookingHistory = async () => {
      try {
        const response = await api.get(
          "/api/bookings/history/"
        );

        const bookingData = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setBookings(bookingData);
      } catch (requestError) {
        console.error(
          "Booking history error:",
          requestError.response?.data ||
            requestError.message
        );

        if (requestError.response?.status === 401) {
          navigate("/login");
          return;
        }

        setError(
          requestError.response?.data?.detail ||
            "Could not load booking history."
        );
      } finally {
        setLoading(false);
      }
    };

    loadBookingHistory();
  }, [navigate]);

  if (loading) {
    return (
      <main className="simple-page">
        <section className="simple-card">
          <h1>Loading booking history...</h1>
        </section>
      </main>
    );
  }

  return (
    <main className="simple-page">
      <section className="simple-card booking-card">
        <p className="hero-label">YOUR BOOKINGS</p>

        <h1>Booking history</h1>

        {error && (
          <p className="error-message">{error}</p>
        )}

        {!error && bookings.length === 0 && (
          <p>No bookings found.</p>
        )}

        {bookings.length > 0 && (
          <div className="booking-list">
            {bookings.map((booking) => {
              const seats = Array.isArray(booking.seats)
                ? booking.seats
                : [];

              const isConfirmed =
                booking.status === "confirmed";

              return (
                <article
                  key={booking.id}
                  className="booking-history-item"
                >
                  <h2>
                    {booking.event_name ||
                      "Event booking"}
                  </h2>

                  <p>
                    <strong>Booking ID:</strong>{" "}
                    {booking.id}
                  </p>

                  <p>
                    <strong>Seats:</strong>{" "}
                    {seats.length > 0
                      ? seats.join(", ")
                      : "No seats listed"}
                  </p>

                  <p>
                    <strong>Tickets:</strong>{" "}
                    {booking.num_tickets}
                  </p>

                  <p>
                    <strong>Total:</strong> ₹
                    {booking.total_price}
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    <span className="booking-status">
                      {booking.status}
                    </span>
                  </p>

                  <Link
                    to={
                      isConfirmed
                        ? `/tickets/${booking.id}`
                        : `/bookings/${booking.id}`
                    }
                    className="back-link"
                  >
                    View booking
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        <Link to="/events" className="back-link">
          ← Browse events
        </Link>
      </section>
    </main>
  );
}

export default BookingHistoryPage;