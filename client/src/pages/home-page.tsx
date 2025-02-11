import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BookingForm from "@/components/booking-form";
import AvailabilityCalendar from "@/components/availability-calendar";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInquirySchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Hero />
      <BookingSection />
      <AboutSection />
      <ContactSection />
    </div>
  );
}

function Hero() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent z-10" />
      <div 
        className="h-[600px] bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1721305254301-bc22475ccf14')" }}
      >
        <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-xl text-white">
            <h1 className="text-5xl font-bold mb-6">Create Your Story in Ink</h1>
            <p className="text-xl mb-8">
              Professional tattoo artistry in a clean, welcoming environment. 
              Book your consultation today and bring your vision to life.
            </p>
            <Button size="lg" asChild>
              <a href="#booking">Book Appointment</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingSection() {
  const [selectedDate, setSelectedDate] = useState<Date>();

  return (
    <div id="booking" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Book Your Appointment</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-center mb-4">Available Dates</h3>
              <AvailabilityCalendar onDateSelect={setSelectedDate} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-center mb-4">Request Booking</h3>
              <BookingForm selectedDate={selectedDate} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">About Our Studio</h2>
            <p className="text-lg mb-4">
              With years of experience and a passion for artistic expression, 
              we pride ourselves on creating unique, meaningful tattoos that tell your story.
            </p>
            <p className="text-lg mb-6">
              Our studio maintains the highest standards of cleanliness and safety, 
              ensuring you can focus entirely on your tattoo journey.
            </p>
            <Button variant="outline" asChild>
              <a href="/gallery">View Our Work</a>
            </Button>
          </div>
          <div 
            className="h-[400px] bg-cover bg-center rounded-lg"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1721305250037-c765d5435cb1')" }}
          />
        </div>
      </div>
    </div>
  );
}

function ContactSection() {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertInquirySchema),
    defaultValues: {
      name: "",
      email: "",
      message: ""
    }
  });

  const inquiryMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/inquiries", data);
    },
    onSuccess: () => {
      toast({ title: "Message sent successfully" });
      form.reset();
    },
    onError: () => {
      toast({ 
        title: "Failed to send message", 
        variant: "destructive" 
      });
    }
  });

  return (
    <div className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Get in Touch</h2>
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => inquiryMutation.mutate(data))} className="space-y-4">
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
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={inquiryMutation.isPending}
                  >
                    Send Message
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}