import json
from rest_framework import serializers
from .models import MockEvent, Seat, Booking, FavoriteEvent


class SeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seat
        fields = ["id", "row", "number", "status", "price", "pos_x", "pos_y"]


class MockEventSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MockEvent

        fields = [
            "id",
            "name",
            "description",
            "event_date",
            "venue_name",
            "city",
            "price_per_seat",
            "seatmap_url",
            "image_url",
        ]

    def get_image_url(self, obj):
        if not obj.raw_data:
            return ""

        try:
            event_data = json.loads(obj.raw_data)
        except (ValueError, TypeError):
            return ""

        images = event_data.get("images") or []

        if not images:
            return ""

        images = sorted(
            images,
            key=lambda image: image.get(
                "width",
                0,
            ),
            reverse=True,
        )

        return images[0].get("url", "")


class BookingSerializer(serializers.ModelSerializer):
    price_per_ticket = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2)

    

    class Meta:
        model = Booking
        fields = [
            "id",
            "mock_event",
            "tm_event_id",
            "event_name",
            "event_date",
            "venue_name",
            "city",
            "num_tickets",
            "price_per_ticket",
            "total_price",
            "status",
            "seats",
            "ticket_id",
            "created_at",
            "expires_at",
        ]
        
    def to_representation(self, instance):
        rep = super().to_representation(instance)
        try:
            rep["seats"] = json.loads(instance.seats) if instance.seats else []
        except (ValueError, TypeError):
            rep["seats"] = []
        return rep

    def create(self, validated_data):
        seats_list = validated_data.pop("seats", [])
        instance = super().create(validated_data)
        instance.seats = json.dumps(seats_list)
        instance.save()
        return instance


class FavoriteEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteEvent
        fields = [
            "id",
            "tm_event_id",
            "name",
            "url",
            "event_date",
            "venue_name",
            "city",
            "created_at",
        ]
        read_only_fields = ["created_at"]