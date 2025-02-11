import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import type { Availability } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface Props {
  onDateSelect?: (date: Date | undefined) => void;
}

export default function AvailabilityCalendar({ onDateSelect }: Props) {
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

  // If no availability data yet, treat all dates as available
  const isDateAvailable = (date: Date) => {
    if (!availability || availability.length === 0) {
      return true; // All dates available if no restrictions set
    }
    return availability.some(a => 
      a.isAvailable && 
      a.date.toString().split('T')[0] === date.toISOString().split('T')[0]
    );
  };

  return (
    <Calendar
      mode="single"
      onSelect={onDateSelect}
      disabled={(date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today || !isDateAvailable(date);
      }}
      className="rounded-md border"
      modifiers={{
        available: (date) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return date >= today && isDateAvailable(date);
        },
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