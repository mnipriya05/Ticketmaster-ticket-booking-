import json
import requests

from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking, FavoriteEvent, MockEvent, Seat
from .serializers import (
    BookingSerializer,
    FavoriteEventSerializer,
    MockEventSerializer,
    SeatSerializer,
)
from .services import search_events


class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True

        return bool(
            request.user
            and request.user.is_authenticated
        )


class IsAuthenticatedUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
        )


class TicketmasterEventsView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        params = {
            key: value
            for key, value in request.query_params.items()
        }

        try:
            data = search_events(**params)
        except requests.RequestException as error:
            return Response(
                {
                    "detail": (
                        "Error contacting Ticketmaster: "
                        f"{str(error)}"
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(data)


class FavoriteEventListCreateView(generics.ListCreateAPIView):
    serializer_class = FavoriteEventSerializer
    permission_classes = [IsAuthenticatedUser]

    def get_queryset(self):
        return FavoriteEvent.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticatedUser]

    def get_queryset(self):
        return Booking.objects.filter(
            user=self.request.user
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BookingDetailView(generics.RetrieveAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticatedUser]

    def get_queryset(self):
        return Booking.objects.filter(
            user=self.request.user
        )


class BookingCancelView(generics.UpdateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticatedUser]

    def get_queryset(self):
        return Booking.objects.filter(
            user=self.request.user
        )

    def patch(self, request, *args, **kwargs):
        booking = self.get_object()

        if booking.status not in ["reserved", "confirmed"]:
            return Response(
                {
                    "detail": (
                        "Only reserved or confirmed bookings "
                        "can be cancelled."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = "cancelled"
        booking.save(update_fields=["status"])

        if booking.mock_event:
            seat_labels = booking.seats_list()

            for label in seat_labels:
                row = label[0]
                number = label[1:]

                Seat.objects.filter(
                    event=booking.mock_event,
                    row=row,
                    number=number,
                    status__in=["reserved", "sold"],
                ).update(status="available")

        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_200_OK,
        )


class MockEventListView(generics.ListAPIView):
    queryset = MockEvent.objects.all()
    serializer_class = MockEventSerializer
    permission_classes = [permissions.AllowAny]


class MockEventSeatsView(generics.RetrieveAPIView):
    serializer_class = MockEventSerializer
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        event = self.get_object()

        seats = Seat.objects.filter(
            event=event
        ).order_by("row", "number")

        return Response(
            {
                "event": MockEventSerializer(event).data,
                "seats": SeatSerializer(
                    seats,
                    many=True
                ).data,
            }
        )

    def get_object(self):
        return get_object_or_404(
            MockEvent,
            pk=self.kwargs["pk"]
        )


class ReserveSeatsView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, event_id):
        seat_ids = request.data.get("seat_ids")

        if not isinstance(seat_ids, list) or not seat_ids:
            return Response(
                {
                    "detail": (
                        "seat_ids must be a non-empty list."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            seat_ids = [
                int(seat_id)
                for seat_id in seat_ids
            ]
        except (TypeError, ValueError):
            return Response(
                {
                    "detail": (
                        "seat_ids must contain valid numbers."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(seat_ids) != len(set(seat_ids)):
            return Response(
                {
                    "detail": (
                        "Duplicate seat IDs are not allowed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        event = get_object_or_404(
            MockEvent,
            id=event_id
        )

        seats = list(
            Seat.objects
            .select_for_update()
            .filter(
                id__in=seat_ids,
                event=event,
            )
            .order_by("id")
        )

        if len(seats) != len(seat_ids):
            return Response(
                {
                    "detail": (
                        "One or more seats do not belong "
                        "to this event."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        unavailable_seats = [
            f"{seat.row}{seat.number}"
            for seat in seats
            if seat.status != "available"
        ]

        if unavailable_seats:
            return Response(
                {
                    "detail": (
                        "Some seats are no longer available."
                    ),
                    "seats": unavailable_seats,
                },
                status=status.HTTP_409_CONFLICT,
            )

        expires_at = (
            timezone.now()
            + timedelta(minutes=10)
        )

        total_price = sum(
            (
                seat.price
                for seat in seats
            ),
            Decimal("0.00"),
        )

        for seat in seats:
            seat.status = "reserved"
            seat.save(
                update_fields=["status"]
            )

        seat_labels = [
            f"{seat.row}{seat.number}"
            for seat in seats
        ]

        booking = Booking.objects.create(
            user=request.user,
            mock_event=event,
            tm_event_id=event.tm_event_id or "",
            event_name=event.name,
            event_date=event.event_date,
            venue_name=event.venue_name,
            city=event.city,
            num_tickets=len(seats),
            price_per_ticket=event.price_per_seat,
            total_price=total_price,
            status="reserved",
            seats=json.dumps(seat_labels),
            expires_at=expires_at,
        )

        return Response(
            {
                "message": (
                    "Seats reserved successfully."
                ),
                "booking_id": booking.id,
                "ticket_id": str(
                    booking.ticket_id
                ),
                "event_id": event.id,
                "seats": seat_labels,
                "num_tickets": booking.num_tickets,
                "price_per_ticket": str(
                    booking.price_per_ticket
                ),
                "total_price": str(
                    booking.total_price
                ),
                "status": booking.status,
                "expires_at": booking.expires_at,
            },
            status=status.HTTP_201_CREATED,
        )


class ConfirmPaymentView(APIView):
    permission_classes = [IsAuthenticatedUser]

    @transaction.atomic
    def post(self, request, pk):
        booking = get_object_or_404(
            Booking,
            pk=pk,
            user=request.user,
        )

        if booking.status != "reserved":
            return Response(
                {
                    "detail": (
                        "Booking is not in reserved state."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            booking.expires_at
            and timezone.now() > booking.expires_at
        ):
            booking.status = "expired"
            booking.save(
                update_fields=["status"]
            )

            if booking.mock_event:
                self.release_booking_seats(booking)

            return Response(
                {
                    "detail": "Reservation expired."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = "confirmed"
        booking.save(
            update_fields=["status"]
        )

        if booking.mock_event:
            seat_labels = booking.seats_list()

            for label in seat_labels:
                row = label[0]
                number = label[1:]

                Seat.objects.filter(
                    event=booking.mock_event,
                    row=row,
                    number=number,
                    status="reserved",
                ).update(status="sold")

        return Response(
            {
                "detail": "Payment successful.",
                "ticket_id": str(
                    booking.ticket_id
                ),
                "booking": BookingSerializer(
                    booking
                ).data,
            }
        )

    @staticmethod
    def release_booking_seats(booking):
        seat_labels = booking.seats_list()

        for label in seat_labels:
            row = label[0]
            number = label[1:]

            Seat.objects.filter(
                event=booking.mock_event,
                row=row,
                number=number,
                status="reserved",
            ).update(status="available")


class BookingHistoryView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticatedUser]

    def get_queryset(self):
        return Booking.objects.filter(
            user=self.request.user
        ).order_by("-created_at")


class TicketDetailView(generics.RetrieveAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticatedUser]

    def get_queryset(self):
        return Booking.objects.filter(
            user=self.request.user,
            status="confirmed",
        )