from django.core.management.base import BaseCommand

from events.services import (
    sync_ticketmaster_events,
)


class Command(BaseCommand):
    help = (
        "Sync events from "
        "Ticketmaster Discovery API"
    )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING(
                "Starting Ticketmaster event sync..."
            )
        )

        try:
            created_count, updated_count = (
                sync_ticketmaster_events()
            )
        except Exception as error:
            self.stdout.write(
                self.style.ERROR(
                    f"Sync failed: {error}"
                )
            )
            return

        self.stdout.write(
            self.style.SUCCESS(
                "Sync complete. "
                f"Created: {created_count}, "
                f"Updated: {updated_count}"
            )
        )