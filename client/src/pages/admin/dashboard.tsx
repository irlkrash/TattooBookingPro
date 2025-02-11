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

// Create a local TimeSlot enum that matches the schema
const TimeSlot = {
  Morning: 'morning',
  Afternoon: 'afternoon',
  Evening: 'evening',
} as const;

export default function AdminDashboard() {
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

  const { toast } = useToast();
  const setAvailabilityMutation = useMutation({
    mutationFn: async ({ date, timeSlot, isAvailable }: { date: Date; timeSlot: TimeSlotType; isAvailable: boolean }) => {
      await apiRequest("POST", "/api/availability", { date, timeSlot, isAvailable });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/availability"] });
      toast({ title: "Availability updated" });
    },
  });

  const getDateAvailability = (date: string) => {
    return availability?.filter(a => a.date === date) || [];
  };

  const timeSlotColors = {
    [TimeSlot.Morning]: 'bg-yellow-500',
    [TimeSlot.Afternoon]: 'bg-orange-500',
    [TimeSlot.Evening]: 'bg-purple-500',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Availability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          {Object.values(TimeSlot).map(slot => (
            <Badge key={slot} variant="outline" className={`${timeSlotColors[slot]} bg-opacity-20`}>
              {slot.charAt(0).toUpperCase() + slot.slice(1)}
            </Badge>
          ))}
        </div>
        <Calendar
          mode="multiple"
          selected={[]}
          onSelect={(dates) => {
            if (!dates) return;

            // Get the newly selected date by comparing with current selection
            const selectedDate = dates[dates.length - 1];
            if (!selectedDate) return;

            const dateStr = selectedDate.toISOString().split('T')[0];
            const currentSlots = new Set(getDateAvailability(dateStr).map(a => a.timeSlot));

            // Show time slot selection for the date
            const timeSlotOptions = Object.values(TimeSlot).filter(slot => !currentSlots.has(slot));

            if (timeSlotOptions.length > 0) {
              timeSlotOptions.forEach(slot => {
                setAvailabilityMutation.mutate({
                  date: selectedDate,
                  timeSlot: slot as TimeSlotType,
                  isAvailable: true
                });
              });
            } else {
              // If all slots were selected, remove them all
              Object.values(TimeSlot).forEach(slot => {
                setAvailabilityMutation.mutate({
                  date: selectedDate,
                  timeSlot: slot as TimeSlotType,
                  isAvailable: false
                });
              });
            }
          }}
          className="rounded-md border"
          modifiers={{
            morning: (date) => {
              const dateStr = date.toISOString().split('T')[0];
              return getDateAvailability(dateStr).some(a => a.timeSlot === TimeSlot.Morning && a.isAvailable);
            },
            afternoon: (date) => {
              const dateStr = date.toISOString().split('T')[0];
              return getDateAvailability(dateStr).some(a => a.timeSlot === TimeSlot.Afternoon && a.isAvailable);
            },
            evening: (date) => {
              const dateStr = date.toISOString().split('T')[0];
              return getDateAvailability(dateStr).some(a => a.timeSlot === TimeSlot.Evening && a.isAvailable);
            },
          }}
          modifiersStyles={{
            morning: { 
              backgroundColor: "rgba(234, 179, 8, 0.2)"
            },
            afternoon: {
              backgroundColor: "rgba(249, 115, 22, 0.2)"
            },
            evening: {
              backgroundColor: "rgba(147, 51, 234, 0.2)"
            }
          }}
        />
      </CardContent>
    </Card>
  );
}