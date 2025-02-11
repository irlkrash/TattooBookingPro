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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function BookingForm({ selectedDate }: { selectedDate?: Date }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(insertBookingRequestSchema),
    defaultValues: {
      name: "",
      bodyPart: "",
      size: "",
      description: "",
      requestedDate: selectedDate || new Date(),
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiRequest("POST", "/api/booking-requests", {
        ...data,
        requestedDate: selectedDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/booking-requests'] });
      toast({ 
        title: "Booking request submitted successfully",
        description: "We'll review your request and get back to you soon."
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit booking request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => bookingMutation.mutate(data))}
        className="space-y-4"
      >
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