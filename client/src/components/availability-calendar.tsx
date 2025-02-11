import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import type { Availability } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface Props {
  onDateSelect?: (date: Date | undefined) => void;
}

const TimeSlot = {
  Morning: 'morning' as const,
  Afternoon: 'afternoon' as const,
  Evening: 'evening' as const,
} as const;

const timeSlotColors = {
  [TimeSlot.Morning]: 'bg-yellow-500',
  [TimeSlot.Afternoon]: 'bg-orange-500',
  [TimeSlot.Evening]: 'bg-purple-500',
};

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

  const isTimeSlotAvailable = (date: string, timeSlot: typeof TimeSlot[keyof typeof TimeSlot]) => {
    return availability?.some(a => 
      a.date === date && 
      a.timeSlot === timeSlot && 
      a.isAvailable
    );
  };

  return (
    <Calendar
      mode="single"
      onSelect={onDateSelect}
      disabled={(date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
      }}
      className="rounded-md border"
      components={{
        Day: ({ date, ...props }) => {
          const dateStr = date.toISOString().split('T')[0];
          const morning = isTimeSlotAvailable(dateStr, TimeSlot.Morning);
          const afternoon = isTimeSlotAvailable(dateStr, TimeSlot.Afternoon);
          const evening = isTimeSlotAvailable(dateStr, TimeSlot.Evening);

          // Get the current date to compare
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Only disable dates before today
          const isDisabled = date < today;

          return (
            <div
              {...props}
              className="relative p-0"
            >
              <button
                disabled={isDisabled}
                className={`w-full h-9 relative ${
                  isDisabled ? "text-muted-foreground opacity-50" : "hover:bg-muted"
                }`}
              >
                <time dateTime={dateStr} className="relative z-10">
                  {date.getDate()}
                </time>
                {/* Only show time slot colors for present and future dates */}
                {!isDisabled && (
                  <>
                    {morning && (
                      <div className={`absolute top-0 left-0 right-0 h-1/3 opacity-20 pointer-events-none ${timeSlotColors[TimeSlot.Morning]}`} />
                    )}
                    {afternoon && (
                      <div className={`absolute top-1/3 left-0 right-0 h-1/3 opacity-20 pointer-events-none ${timeSlotColors[TimeSlot.Afternoon]}`} />
                    )}
                    {evening && (
                      <div className={`absolute top-2/3 left-0 right-0 h-1/3 opacity-20 pointer-events-none ${timeSlotColors[TimeSlot.Evening]}`} />
                    )}
                  </>
                )}
              </button>
            </div>
          );
        }
      }}
    />
  );
}