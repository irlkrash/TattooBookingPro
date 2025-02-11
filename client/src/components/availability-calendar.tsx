import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import type { Availability } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import BookingForm from "./booking-form";

export default function AvailabilityCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>();
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
    <div className="space-y-6">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
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

      {selectedDate && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Request Booking for {selectedDate.toLocaleDateString()}</h3>
          <BookingForm selectedDate={selectedDate} />
        </div>
      )}
    </div>
  );
}