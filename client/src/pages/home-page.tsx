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
import { useDesignContext } from "@/providers/design-config-provider";
import "./home-page.css";

export default function HomePage() {
  const { getConfigValue } = useDesignContext();
  const headerImage = getConfigValue("header_background_image", "");
  const headerColor = getConfigValue("header_background_color", "#1f2937");
  const headerTextColor = getConfigValue("header_text_color", "#ffffff");
  const logoText = getConfigValue("logo_text", "Tattoo Studio");

  return (
    <div className="min-h-screen">
      <header className="site-header">
        <div 
          className="header-background"
          style={{
            backgroundColor: headerColor,
            backgroundImage: headerImage ? `url(${headerImage})` : 'none',
          }}
        />
        <div className="header-content" style={{ color: headerTextColor }}>
          <h1>{logoText}</h1>
          <nav>
            <a href="/gallery">Gallery</a>
            <a href="/admin">Admin Dashboard</a>
          </nav>
        </div>
      </header>
      <main>
        <Hero />
        <BookingSection />
        <AboutSection />
        <ContactSection />
      </main>
    </div>
  );
}

function Hero() {
  const { getConfigValue } = useDesignContext();

  return (
    <section className="hero-section">
      <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
        <div className="max-w-xl text-white">
          <h1 className="text-5xl font-bold mb-6">
            {getConfigValue("hero_heading", "Create Your Story in Ink")}
          </h1>
          <p className="text-xl mb-8">
            {getConfigValue("hero_subtext", "Professional tattoo artistry in a clean, welcoming environment. Book your consultation today and bring your vision to life.")}
          </p>
          <Button size="lg" asChild>
            <a href="#booking">Book Appointment</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function BookingSection() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { getConfigValue } = useDesignContext();

  return (
    <section id="booking" className="booking-section">
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {getConfigValue("booking_title", "Book Your Appointment")}
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-center mb-4">
                {getConfigValue("availability_title", "Available Dates")}
              </h3>
              <AvailabilityCalendar onDateSelect={setSelectedDate} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-center mb-4">
                {getConfigValue("booking_form_title", "Request Booking")}
              </h3>
              <BookingForm selectedDate={selectedDate} />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const { getConfigValue } = useDesignContext();

  return (
    <section className="about-section py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">
              {getConfigValue("about_title", "About Our Studio")}
            </h2>
            <p className="text-lg mb-4">
              {getConfigValue("about_text", "With years of experience and a passion for artistic expression, we pride ourselves on creating unique, meaningful tattoos that tell your story.")}
            </p>
            <p className="text-lg mb-6">
              {getConfigValue("about_description", "Our studio maintains the highest standards of cleanliness and safety, ensuring you can focus entirely on your tattoo journey.")}
            </p>
            <Button variant="outline" asChild>
              <a href="/gallery">View Our Work</a>
            </Button>
          </div>
          <div className="relative h-[400px] rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: `url(${getConfigValue("about_image", "https://images.unsplash.com/photo-1721305250037-c765d5435cb1")})`}}/>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const { toast } = useToast();
  const { getConfigValue } = useDesignContext();

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
    <section className="contact-section py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          {getConfigValue("contact_title", "Get in Touch")}
        </h2>
        {getConfigValue("contact_info") && (
          <p className="text-center mb-8">{getConfigValue("contact_info")}</p>
        )}
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
    </section>
  );
}