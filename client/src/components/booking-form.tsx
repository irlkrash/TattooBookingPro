import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBookingRequestSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Availability } from "@shared/schema";

const TimeSlot = {
  Morning: 'morning' as const,
  Afternoon: 'afternoon' as const,
  Evening: 'evening' as const,
} as const;

const timeSlotLabels = {
  [TimeSlot.Morning]: 'Morning (8am - 12pm)',
  [TimeSlot.Afternoon]: 'Afternoon (12pm - 4pm)',
  [TimeSlot.Evening]: 'Evening (4pm - 8pm)',
};

const timeSlotOrder = {
  [TimeSlot.Morning]: 0,
  [TimeSlot.Afternoon]: 1,
  [TimeSlot.Evening]: 2,
};

export default function BookingForm({ selectedDate }: { selectedDate?: Date }) {
  const { toast } = useToast();

  const { data: availability } = useQuery<Availability[]>({
    queryKey: ["/api/availability"],
  });

  const form = useForm({
    resolver: zodResolver(insertBookingRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      bodyPart: "",
      size: "",
      description: "",
      timeSlot: undefined,
      requestedDate: selectedDate || new Date(),
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (formData: any) => {
      const bookingData = {
        ...formData,
        requestedDate: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      };
      console.log('Submitting booking data:', bookingData);
      const response = await apiRequest("POST", "/api/booking-requests", bookingData);
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      toast({ 
        title: "Booking request submitted successfully",
        description: "We'll review your request and get back to you soon."
      });
      form.reset();
    },
    onError: (error: Error) => {
      console.error('Booking submission error:', error);
      toast({
        title: "Failed to submit booking request",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    if (!selectedDate) {
      toast({
        title: "Please select a date",
        description: "You must select a date for your booking",
        variant: "destructive",
      });
      return;
    }
    if (!data.timeSlot) {
      toast({
        title: "Please select a time slot",
        description: "You must select an available time slot",
        variant: "destructive",
      });
      return;
    }
    console.log('Form data before submission:', data);
    bookingMutation.mutate(data);
  };

  // Get available time slots for the selected date
  const availableTimeSlots = selectedDate
    ? availability
        ?.filter(a => 
          a.date === selectedDate.toISOString().split('T')[0] && 
          a.isAvailable
        )
        .map(a => ({
          value: a.timeSlot,
          label: timeSlotLabels[a.timeSlot as keyof typeof timeSlotLabels]
        }))
        .sort((a, b) => 
          timeSlotOrder[a.value as keyof typeof timeSlotOrder] - 
          timeSlotOrder[b.value as keyof typeof timeSlotOrder]
        ) || []
    : [];

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {selectedDate && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Selected Date: <span className="font-medium text-foreground">{format(selectedDate, 'MMMM d, yyyy')}</span>
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="timeSlot"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time Slot</FormLabel>
              <Select
                disabled={!selectedDate || availableTimeSlots.length === 0}
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !selectedDate 
                        ? "Select a date first"
                        : availableTimeSlots.length === 0
                        ? "No available time slots"
                        : "Select a time slot"
                    } />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableTimeSlots.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} placeholder="your@email.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bodyPart"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Body Part</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Arm, Back, Leg" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Size (in inches)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., 4x6" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Please describe your tattoo idea in detail"
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={bookingMutation.isPending}
        >
          {bookingMutation.isPending ? "Submitting..." : "Submit Booking Request"}
        </Button>
      </form>
    </Form>
  );
}