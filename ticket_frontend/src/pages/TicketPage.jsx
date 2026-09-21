import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/api";

function TicketPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTicket = async () => {
      try {
        const response = await api.get(
          `/api/tickets/${bookingId}/`
        );

        setTicket(response.data);
      } catch (requestError) {
        console.error(
          "Ticket error:",
          requestError.response?.data ||
            requestError.message
        );

        if (requestError.response?.status === 401) {
          navigate("/login");
          return;
        }

        setError(
          requestError.response?.data?.detail ||
            "Could not load ticket."
        );
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [bookingId, navigate]);

  if (loading) {
    return (
      <main className="simple-page">
        <section className="simple-card">
          <h1>Loading ticket...</h1>
        </section>
      </main>
    );
  }

  if (error || !ticket) {
    return (
      <main className="simple-page">
        <section className="simple-card">
          <p className="error-message">
            {error || "Ticket not found."}
          </p>

          <Link to="/events" className="back-link">
            ← Back to events
          </Link>
        </section>
      </main>
    );
  }

  const seats = Array.isArray(ticket.seats)
    ? ticket.seats
    : [];

  return (
    <main className="simple-page">
      <section className="simple-card booking-card">
        <p className="hero-label">TICKET CONFIRMED</p>

        <h1>{ticket.event_name}</h1>

        <p className="success-message">
          Your mock payment was successful.
        </p>

        <div className="booking-information">
          <p>
            <strong>Ticket ID:</strong>{" "}
            {ticket.ticket_id || "Not available"}
          </p>

          <p>
            <strong>Booking ID:</strong>{" "}
            {ticket.booking_id || bookingId}
          </p>

          <p>
            <strong>Date:</strong>{" "}
            {ticket.event_date
              ? new Date(
                  ticket.event_date
                ).toLocaleString()
              : "Not available"}
          </p>

          <p>
            <strong>Venue:</strong>{" "}
            {ticket.venue_name || "Not available"}
          </p>

          <p>
            <strong>Location:</strong>{" "}
            {ticket.city || "Not available"}
          </p>

          <p>
            <strong>Seats:</strong>{" "}
            {seats.length > 0
              ? seats.join(", ")
              : "No seats listed"}
          </p>

          <p>
            <strong>Number of tickets:</strong>{" "}
            {ticket.num_tickets}
          </p>

          <p>
            <strong>Total paid:</strong> ₹
            {ticket.total_price}
          </p>

          <p>
            <strong>Status:</strong> Confirmed
          </p>
        </div>

        <Link
          to="/booking-history"
          className="reserve-button ticket-link"
        >
          View booking history
        </Link>

        <Link to="/events" className="back-link">
          ← Browse more events
        </Link>
      </section>
    </main>
  );
}

export default TicketPage;