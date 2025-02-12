import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { TimeSlot as TimeSlotType, type BookingRequest, type Inquiry, type Availability, type DesignConfig } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Upload } from "lucide-react";
import { useState, useCallback, useRef } from "react";
import debounce from "lodash/debounce";

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
          <TabsTrigger value="design">Design</TabsTrigger>
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

        <TabsContent value="design">
          <DesignManager />
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

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;

    // Format the date string once for comparison
    const dateStr = date.toISOString().split('T')[0];

    // Get existing available slots for this date
    const existingSlots = availability?.filter(a =>
      a.date === dateStr && a.isAvailable
    ) || [];

    try {
      // First, set all existing slots to unavailable
      for (const slot of existingSlots) {
        await setAvailabilityMutation.mutateAsync({
          date,
          timeSlot: slot.timeSlot as TimeSlotType,
          isAvailable: false
        });
      }

      // Then, if we have selected time slots, set them as available
      if (selectedTimeSlots.size > 0) {
        const timeSlots = Array.from(selectedTimeSlots);
        for (const timeSlot of timeSlots) {
          await setAvailabilityMutation.mutateAsync({
            date,
            timeSlot,
            isAvailable: true
          });
        }
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Failed to update availability",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
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
      a => a.timeSlot === timeSlot && a.isAvailable
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

        <Calendar
          mode="single"
          selected={undefined}
          onSelect={handleDateSelect}
          className="rounded-md border"
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

              // Get the current date to compare
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              // Only disable dates before today
              const isDisabled = date < today;

              return (
                <div
                  {...props}
                  className="relative p-0"
                  onClick={() => handleDateSelect(date)}
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
      </CardContent>
    </Card>
  );
}

function DesignManager() {
  const { data: designConfigs, isLoading } = useQuery<DesignConfig[]>({
    queryKey: ["/api/design-config"],
  });

  const { toast } = useToast();
  const sections = Array.from(new Set(designConfigs?.map(config => config.section) || ['home']));
  const [selectedSection, setSelectedSection] = useState(sections[0] || 'home');
  const [pendingChanges, setPendingChanges] = useState<Record<number, string>>({});
  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

  const updateDesignMutation = useMutation({
    mutationFn: async ({ key, value, type, section }: { key: string; value: string; type: string; section: string }) => {
      console.log('Updating design config:', { key, value, type, section });
      const response = await apiRequest("POST", "/api/design-config", { key, value, type, section });
      console.log('Update response:', response);
      return response;
    },
    onSuccess: () => {
      // Force a cache invalidation
      queryClient.invalidateQueries({ queryKey: ["/api/design-config"] });
    },
    onError: (error: any) => {
      console.error('Design update error:', error);
      toast({
        title: "Failed to update design",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (configId: number, value: string) => {
    setPendingChanges(prev => ({
      ...prev,
      [configId]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      console.log('Saving changes:', pendingChanges);

      // Apply all pending changes
      for (const [configId, value] of Object.entries(pendingChanges)) {
        const config = designConfigs?.find(c => c.id === Number(configId));
        if (config) {
          console.log('Updating config:', config.key, value);
          await updateDesignMutation.mutateAsync({
            key: config.key,
            value,
            type: config.type,
            section: config.section,
          });
        }
      }

      // Clear pending changes
      setPendingChanges({});

      // Force a cache invalidation and refetch
      await queryClient.invalidateQueries({ queryKey: ["/api/design-config"] });

      toast({
        title: "Design changes saved successfully",
        description: "Your changes have been applied.",
      });
    } catch (error) {
      console.error('Save changes error:', error);
      toast({
        title: "Failed to save changes",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin" />;

  const filteredConfigs = designConfigs
    ?.filter(config => config.section === selectedSection)
    .sort((a, b) => a.id - b.id) || [];

  return (
    <div className="relative min-h-[600px] container mx-auto">
      <Card className="max-w-[50%]">
        <CardHeader>
          <CardTitle>Design Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Label>Section:</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(section => (
                    <SelectItem key={section} value={section}>
                      {section.charAt(0).toUpperCase() + section.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {filteredConfigs.map((config) => (
                  <div key={config.id} className="space-y-2 border-b pb-4 last:border-0">
                    <Label className="text-lg font-semibold">
                      {config.key
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')}:
                    </Label>

                    {config.type === 'color' ? (
                      <div className="flex items-center gap-4">
                        <Input
                          type="color"
                          value={pendingChanges[config.id] ?? config.value}
                          className="w-24 h-10"
                          onChange={(e) => handleInputChange(config.id, e.target.value)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {pendingChanges[config.id] ?? config.value}
                        </span>
                      </div>
                    ) : config.type === 'font' ? (
                      <Select
                        value={pendingChanges[config.id] ?? config.value}
                        onValueChange={(value) => handleInputChange(config.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                          {['Inter', 'Montserrat', 'Roboto', 'Open Sans', 'Lato'].map(font => (
                            <SelectItem key={font} value={font}>
                              {font}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={pendingChanges[config.id] ?? config.value}
                        onChange={(e) => handleInputChange(config.id, e.target.value)}
                        type="text"
                        className="w-full"
                      />
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      Type: {config.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {hasUnsavedChanges && (
        <div className="fixed bottom-8 right-8">
          <Button
            onClick={handleSaveChanges}
            disabled={updateDesignMutation.isPending}
            className="gap-2 bg-red-500 hover:bg-red-600 text-black font-medium"
          >
            {updateDesignMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;