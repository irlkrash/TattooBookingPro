import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { TimeSlot as TimeSlotType, type BookingRequest, type Inquiry, type Availability } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X } from "lucide-react";
import { useState } from "react";

// Create a local TimeSlot enum that matches the schema
const TimeSlot = {
  Morning: 'morning' as const,
  Afternoon: 'afternoon' as const,
  Evening: 'evening' as const,
} as const;

function AdminDashboard() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">Booking Requests</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <BookingRequests />
        </TabsContent>

        <TabsContent value="inquiries">
          <Inquiries />
        </TabsContent>

        <TabsContent value="availability">
          <AvailabilityManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingRequests() {
  const { data: requests, isLoading } = useQuery<BookingRequest[]>({
    queryKey: ["/api/booking-requests"],
  });

  const { toast } = useToast();
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PATCH", `/api/booking-requests/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/booking-requests"] });
      toast({ title: "Booking status updated" });
    },
  });

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin" />;

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4 p-4">
        {requests?.map((request) => (
          <Card key={request.id}>
            <CardContent className="py-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{request.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(request.requestedDate), "PPP")}
                  </p>
                  <p className="mt-2">
                    <span className="font-medium">Body Part:</span> {request.bodyPart}
                  </p>
                  <p>
                    <span className="font-medium">Size:</span> {request.size}
                  </p>
                  <p className="mt-2">{request.description}</p>
                </div>
                <div className="space-x-2">
                  <Badge variant={request.status === "pending" ? "secondary" : request.status === "approved" ? "default" : "destructive"}>
                    {request.status}
                  </Badge>
                  {request.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => updateMutation.mutate({ id: request.id, status: "approved" })}
                        disabled={updateMutation.isPending}
                      >
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => updateMutation.mutate({ id: request.id, status: "rejected" })}
                        disabled={updateMutation.isPending}
                      >
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

function Inquiries() {
  const { data: inquiries, isLoading } = useQuery<Inquiry[]>({
    queryKey: ["/api/inquiries"],
  });

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin" />;

  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-4 p-4">
        {inquiries?.map((inquiry) => (
          <Card key={inquiry.id}>
            <CardContent className="py-4">
              <div>
                <h3 className="font-semibold">{inquiry.name}</h3>
                <p className="text-sm text-muted-foreground">{inquiry.email}</p>
                <p className="mt-2">{inquiry.message}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {format(new Date(inquiry.createdAt), "PPP")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}

function AvailabilityManager() {
  const { data: availability } = useQuery<Availability[]>({
    queryKey: ["/api/availability"],
  });

  const [selectedTimeSlots, setSelectedTimeSlots] = useState<Set<TimeSlotType>>(new Set());
  const { toast } = useToast();

  const setAvailabilityMutation = useMutation({
    mutationFn: async ({ date, timeSlot, isAvailable }: { date: Date; timeSlot: TimeSlotType; isAvailable: boolean }) => {
      await apiRequest("POST", "/api/availability", { date, timeSlot, isAvailable });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({ title: "Availability updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update availability",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleTimeSlot = (timeSlot: TimeSlotType) => {
    setSelectedTimeSlots(prev => {
      const newSet = new Set(prev);
      if (prev.has(timeSlot)) {
        newSet.delete(timeSlot);
      } else {
        newSet.add(timeSlot);
      }
      return newSet;
    });
  };

  const handleDateSelect = async (date: Date) => {
    if (selectedTimeSlots.size === 0) {
      toast({
        title: "No time slots selected",
        description: "Please select at least one time slot (Morning/Afternoon/Evening) first",
        variant: "destructive",
      });
      return;
    }

    // First, clear existing availability for this date
    const dateStr = date.toISOString().split('T')[0];
    const existingSlots = availability?.filter(a => a.date === dateStr) || [];

    // Set all existing slots to unavailable first
    for (const slot of existingSlots) {
      if (slot.isAvailable) {
        try {
          await setAvailabilityMutation.mutateAsync({
            date,
            timeSlot: slot.timeSlot as TimeSlotType,
            isAvailable: false
          });
        } catch (error) {
          break;
        }
      }
    }

    // Then set the new selected slots
    const timeSlots = Array.from(selectedTimeSlots);
    for (const timeSlot of timeSlots) {
      try {
        await setAvailabilityMutation.mutateAsync({
          date,
          timeSlot,
          isAvailable: true
        });
      } catch (error) {
        break;
      }
    }
  };

  const getDateAvailability = (date: string) => {
    return availability?.filter(a => a.date === date) || [];
  };

  const timeSlotColors = {
    [TimeSlot.Morning]: 'bg-yellow-500',
    [TimeSlot.Afternoon]: 'bg-orange-500',
    [TimeSlot.Evening]: 'bg-purple-500',
  };

  const isTimeSlotAvailable = (date: string, timeSlot: TimeSlotType) => {
    return getDateAvailability(date).some(
      a =>
        a.timeSlot === timeSlot && a.isAvailable
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            First, select time slots below, then click on dates to set availability:
          </p>
          <div className="flex gap-2">
            {Object.entries(TimeSlot).map(([name, slot]) => {
              const isSelected = selectedTimeSlots.has(slot);

              return (
                <Badge
                  key={slot}
                  variant={isSelected ? "default" : "outline"}
                  className={`
                    ${timeSlotColors[slot]} 
                    ${isSelected ? 'bg-opacity-100' : 'bg-opacity-20'} 
                    cursor-pointer hover:bg-opacity-80
                    transition-all
                  `}
                  onClick={() => toggleTimeSlot(slot)}
                >
                  {name}
                </Badge>
              );
            })}
          </div>
        </div>

        <style>
          {`
            .calendar-day {
              position: relative;
              height: 100%;
            }
            .time-slot {
              position: absolute;
              left: 0;
              right: 0;
              height: 33.33%;
              opacity: 0.2;
              transition: opacity 0.2s;
            }
            .time-slot:hover {
              opacity: 0.3;
            }
            .morning-slot { top: 0; }
            .afternoon-slot { top: 33.33%; }
            .evening-slot { top: 66.66%; }
          `}
        </style>

        <Calendar
          mode="single"
          selected={undefined}
          onSelect={(date) => {
            if (date) {
              handleDateSelect(date);
            }
          }}
          className="rounded-md border"
          modifiers={{
            hasAvailability: (date) => {
              const dateStr = date.toISOString().split('T')[0];
              return [TimeSlot.Morning, TimeSlot.Afternoon, TimeSlot.Evening].some(
                slot => isTimeSlotAvailable(dateStr, slot)
              );
            }
          }}
          modifiersClassNames={{
            hasAvailability: "relative overflow-hidden"
          }}
          components={{
            Day: ({ date, className, ...props }) => {
              const dateStr = date.toISOString().split('T')[0];
              const morning = isTimeSlotAvailable(dateStr, TimeSlot.Morning);
              const afternoon = isTimeSlotAvailable(dateStr, TimeSlot.Afternoon);
              const evening = isTimeSlotAvailable(dateStr, TimeSlot.Evening);

              return (
                <div {...props} className={`calendar-day ${className || ''}`}>
                  <span className="relative z-10">{date.getDate()}</span>
                  {morning && (
                    <div className={`time-slot morning-slot ${timeSlotColors[TimeSlot.Morning]}`} />
                  )}
                  {afternoon && (
                    <div className={`time-slot afternoon-slot ${timeSlotColors[TimeSlot.Afternoon]}`} />
                  )}
                  {evening && (
                    <div className={`time-slot evening-slot ${timeSlotColors[TimeSlot.Evening]}`} />
                  )}
                </div>
              );
            }
          }}
        />
      </CardContent>
    </Card>
  );
}

export default AdminDashboard;