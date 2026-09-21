import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from events.models import MockEvent, Seat

for event in MockEvent.objects.all():
    if Seat.objects.filter(event=event).exists():
        print("Already has seats:", event.id, event.name)
        continue

    seats = []

    for row in ["A", "B", "C", "D", "E"]:
        for number in range(1, 11):
            seats.append(
                Seat(
                    event=event,
                    row=row,
                    number=number,
                    status="available",
                    price=500
                )
            )

    Seat.objects.bulk_create(seats)

    if not event.price_per_seat:
        event.price_per_seat = 500
        event.save(update_fields=["price_per_seat"])

    print("Created 50 seats:", event.id, event.name)

print("Finished")