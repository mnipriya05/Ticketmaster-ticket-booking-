from django.urls import path
from . import views

urlpatterns = [
    path("external/events/", views.TicketmasterEventsView.as_view(), name="tm-events"),

    path("favorites/", views.FavoriteEventListCreateView.as_view(), name="favorite-list-create"),

    path("bookings/", views.BookingListCreateView.as_view(), name="booking-list-create"),
    path("bookings/<int:pk>/", views.BookingDetailView.as_view(), name="booking-detail"),
    path("bookings/<int:pk>/cancel/", views.BookingCancelView.as_view(), name="booking-cancel"),

    path("mock-events/", views.MockEventListView.as_view(), name="mock-event-list"),
    path("mock-events/<int:pk>/seats/", views.MockEventSeatsView.as_view(), name="mock-event-seats"),
    path("mock-events/<int:event_id>/reserve/", views.ReserveSeatsView.as_view(), name="reserve-seats"),

    path("bookings/<int:pk>/pay/", views.ConfirmPaymentView.as_view(), name="confirm-payment"),
    path("bookings/history/", views.BookingHistoryView.as_view(), name="booking-history"),
    path("tickets/<int:pk>/", views.TicketDetailView.as_view(), name="ticket-detail"),
]