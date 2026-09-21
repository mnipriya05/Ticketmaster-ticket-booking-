import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import api from "../api/api";


function BookingPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("idle");

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const response = await api.get(
          `/api/bookings/${bookingId}/`
        );

        setBooking(response.data);
      } catch (requestError) {
        console.error(
          "Booking error:",
          requestError.response?.data ||
            requestError.message
        );

        if (requestError.response?.status === 401) {
          navigate("/login");
          return;
        }

        setError(
          requestError.response?.data?.detail ||
            "Could not load booking."
        );
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      loadBooking();
    }
  }, [bookingId, navigate]);

  const handlePayment = async () => {
    try {
      setPaymentStatus("processing");
      setError("");

      await new Promise((resolve) => {
        setTimeout(resolve, 1800);
      });

      setPaymentStatus("success");

      await new Promise((resolve) => {
        setTimeout(resolve, 1200);
      });

      const response = await api.post(
        `/api/bookings/${bookingId}/pay/`
      );

      const confirmedBooking =
        response.data.booking || response.data;

      setBooking(confirmedBooking);

      navigate(`/tickets/${bookingId}`);
    } catch (requestError) {
      console.error(
        "Payment error:",
        requestError.response?.data ||
          requestError.message
      );

      setPaymentStatus("idle");

      if (requestError.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError(
        requestError.response?.data?.detail ||
          "Payment failed."
      );
    }
  };

  const openPaymentModal = () => {
    setPaymentStatus("idle");
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    if (paymentStatus === "processing") {
      return;
    }

    setShowPaymentModal(false);
    setPaymentStatus("idle");
  };

  if (loading) {
    return (
      <main className="simple-page">
        <section className="simple-card">
          <h1>Loading booking...</h1>
        </section>
      </main>
    );
  }

  if (error && !booking) {
    return (
      <main className="simple-page">
        <section className="simple-card">
          <p className="error-message">
            {error}
          </p>

          <Link
            to="/events"
            className="back-link"
          >
            ← Back to events
          </Link>
        </section>
      </main>
    );
  }

  if (!booking) {
    return null;
  }

  const seats = Array.isArray(booking.seats)
    ? booking.seats
    : [];

  const isReserved =
    booking.status === "reserved";

  const isConfirmed =
    booking.status === "confirmed";

  return (
    <>
      <main className="simple-page">
        <section className="simple-card booking-card">
          <p className="hero-label">
            YOUR BOOKING
          </p>

          <h1>
            {booking.event_name || "Event booking"}
          </h1>

          <div className="booking-information">
            <p>
              <strong>Booking ID:</strong>{" "}
              {booking.id}
            </p>

            <p>
              <strong>Ticket ID:</strong>{" "}
              {booking.ticket_id ||
                "Will be generated after payment"}
            </p>

            <p>
              <strong>Date:</strong>{" "}
              {booking.event_date
                ? new Date(
                    booking.event_date
                  ).toLocaleString()
                : "Not available"}
            </p>

            <p>
              <strong>Venue:</strong>{" "}
              {booking.venue_name ||
                "Not available"}
            </p>

            <p>
              <strong>Location:</strong>{" "}
              {booking.city || "Not available"}
            </p>

            <p>
              <strong>Seats:</strong>{" "}
              {seats.length > 0
                ? seats.join(", ")
                : "No seats listed"}
            </p>

            <p>
              <strong>Number of tickets:</strong>{" "}
              {booking.num_tickets}
            </p>

            <p>
              <strong>Total:</strong> ₹
              {Number(
                booking.total_price || 0
              ).toFixed(2)}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              <span className="booking-status">
                {booking.status}
              </span>
            </p>

            {booking.expires_at && isReserved && (
              <p>
                <strong>
                  Reservation expires:
                </strong>{" "}
                {new Date(
                  booking.expires_at
                ).toLocaleString()}
              </p>
            )}
          </div>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          {isReserved && (
            <button
              type="button"
              className="reserve-button"
              onClick={openPaymentModal}
            >
              Continue to payment
            </button>
          )}

          {isConfirmed && (
            <Link
              to={`/tickets/${booking.id}`}
              className="reserve-button ticket-link"
            >
              View ticket
            </Link>
          )}

          <Link
            to="/events"
            className="back-link"
          >
            ← Back to events
          </Link>
        </section>
      </main>

      {showPaymentModal && (
        <div className="payment-overlay">
          <div className="payment-modal">
            {paymentStatus === "idle" && (
              <>
                <div className="gpay-title">
                  Google Pay
                </div>

                <h2>Pay securely</h2>

                <p>
                  Amount: ₹
                  {Number(
                    booking.total_price || 0
                  ).toFixed(2)}
                </p>

                <button
                  type="button"
                  className="gpay-pay-button"
                  onClick={handlePayment}
                >
                  Pay with Google Pay
                </button>

                <button
                  type="button"
                  className="cancel-payment-button"
                  onClick={closePaymentModal}
                >
                  Cancel
                </button>
              </>
            )}

            {paymentStatus === "processing" && (
              <>
                <div className="payment-spinner"></div>

                <h2>
                  Processing payment
                </h2>

                <p>
                  Please wait...
                </p>
              </>
            )}

            {paymentStatus === "success" && (
              <>
                <div className="success-tick">
                  ✓
                </div>

                <h2>
                  Payment successful
                </h2>

                <p>
                  Your booking is confirmed.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}


export default BookingPage;