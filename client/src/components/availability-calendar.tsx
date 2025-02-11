import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import type { Availability } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

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
    <div className="space-y-6">
      <div className="w-full">
        <Calendar
          mode="single"
          selected={undefined}
          onSelect={onDateSelect}
          className="rounded-md border max-w-none w-full text-[max(1vw,12px)]"
          classNames={{
            months: "w-full",
            month: "w-full",
            table: "w-full border-collapse",
            head_row: "grid grid-cols-7",
            head_cell: "text-muted-foreground text-center p-[max(1vw,8px)] font-medium",
            row: "grid grid-cols-7",
            cell: "min-h-[max(8vw,40px)] relative p-0",
            day: "h-full w-full",
            day_selected: "bg-primary text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50",
            day_hidden: "invisible",
            nav: "flex items-center justify-between px-[max(1vw,8px)]",
            nav_button: "h-[max(2vw,28px)] w-[max(2vw,28px)] bg-transparent p-0 opacity-50 hover:opacity-100",
            nav_button_previous: "",
            nav_button_next: "",
            caption: "text-[max(1.2vw,16px)] font-medium py-[max(1vw,8px)]",
          }}
          disabled={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return date < today;
          }}
          components={{
            Day: ({ date, ...props }) => {
              const dateStr = date.toISOString().split('T')[0];
              const morning = isTimeSlotAvailable(dateStr, TimeSlot.Morning);
              const afternoon = isTimeSlotAvailable(dateStr, TimeSlot.Afternoon);
              const evening = isTimeSlotAvailable(dateStr, TimeSlot.Evening);

              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isDisabled = date < today;

              return (
                <div
                  {...props}
                  className="relative h-full"
                  onClick={() => onDateSelect?.(date)}
                >
                  <button
                    disabled={isDisabled}
                    className={`w-full h-full min-h-[max(8vw,40px)] flex items-center justify-center ${
                      isDisabled ? "text-muted-foreground opacity-50" : "hover:bg-muted"
                    }`}
                  >
                    <time dateTime={dateStr} className="relative z-10">
                      {date.getDate()}
                    </time>
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
      </div>

      <Card className="p-4">
        <p className="text-sm text-muted-foreground mb-3">
          The colored sections on available dates indicate the times we can schedule your appointment:
        </p>
        <div className="space-y-2">
          {Object.entries(TimeSlot).map(([name, slot]) => (
            <div key={slot} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${timeSlotColors[slot]}`} />
              <span className="text-sm">{name} {name === 'Morning' ? '(8am - 12pm)' :
                name === 'Afternoon' ? '(12pm - 4pm)' : '(4pm - 8pm)'}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}