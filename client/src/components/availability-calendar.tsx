import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import type { Availability } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function AvailabilityCalendar() {
  const { data: availability, isLoading } = useQuery<Availability[]>({
    queryKey: ["/api/availability"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const availableDates = new Set(
    availability?.filter(a => a.isAvailable).map(a => a.date.toString())
  );

  const isDateAvailable = (date: Date) => {
    return availableDates.has(date.toISOString().split('T')[0]);
  };

  return (
    <Calendar
      mode="single"
      selected={undefined}
      disabled={(date) => !isDateAvailable(date)}
      className="rounded-md border"
      modifiers={{
        available: (date) => isDateAvailable(date),
      }}
      modifiersStyles={{
        available: { 
          backgroundColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))" 
        }
      }}
    />
  );
}
