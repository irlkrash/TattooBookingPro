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
import { TimeSlot as TimeSlotType, type BookingRequest, type Inquiry, type Availability, type DesignConfig, type GalleryImage } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Upload } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import debounce from "lodash/debounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";


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
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
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

        <TabsContent value="gallery">
          <GalleryManager />
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
  const sections = Array.from(new Set(designConfigs?.map(config => config.section) || ['home', 'theme', 'about', 'gallery', 'contact']));
  const [selectedSection, setSelectedSection] = useState(sections[0] || 'home');
  const [pendingChanges, setPendingChanges] = useState<Record<number, string>>({});
  const hasUnsavedChanges = Object.keys(pendingChanges).length > 0;

  const updateDesignMutation = useMutation({
    mutationFn: async ({ key, value, type, section }: { key: string; value: string; type: string; section: string }) => {
      const response = await apiRequest("POST", "/api/design-config", { key, value, type, section });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/design-config"] });
      toast({
        title: "Design changes saved successfully",
        description: "Your changes have been applied.",
      });
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
      // Apply all pending changes
      for (const [configId, value] of Object.entries(pendingChanges)) {
        const config = designConfigs?.find(c => c.id === Number(configId));
        if (config) {
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

      // Force a cache invalidation for both design config and the client routes
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/design-config"] }),
        queryClient.invalidateQueries({ queryKey: ["/"] }), // Invalidate home page
        queryClient.invalidateQueries({ queryKey: ["/gallery"] }), // Invalidate gallery page
        queryClient.invalidateQueries({ queryKey: ["/contact"] }), // Invalidate contact page
      ]);

    } catch (error) {
      console.error('Save changes error:', error);
      toast({
        title: "Failed to save changes",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!designConfigs || isLoading) return;

    const addMissingConfigs = async () => {
      try {
        for (const [section, configs] of Object.entries(defaultConfigs)) {
          for (const config of configs) {
            const exists = designConfigs.some(c => c.key === config.key);
            if (!exists) {
              await updateDesignMutation.mutateAsync(config);
            }
          }
        }
      } catch (error) {
        console.error('Error adding default configs:', error);
        toast({
          title: "Failed to add default configurations",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive",
        });
      }
    };

    addMissingConfigs();
  }, [designConfigs, isLoading]);

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin" />;

  const filteredConfigs = designConfigs
    ?.filter(config => config.section === selectedSection)
    .sort((a, b) => a.id - b.id) || [];

  const defaultConfigs = {
    theme: [
      { key: 'booking_section_background', type: 'color', section: 'theme', value: '#f5f5f5' },
      { key: 'contact_section_background', type: 'color', section: 'theme', value: '#f5f5f5' },
      { key: 'gallery_description_color', type: 'color', section: 'theme', value: '#6b7280' },
      { key: 'available_dates_background', type: 'color', section: 'theme', value: '#4ade80' },
      { key: 'booking_form_background', type: 'color', section: 'theme', value: '#f8fafc' },
      { key: 'contact_form_background', type: 'color', section: 'theme', value: '#f8fafc' },
    ],
    about: [
      { key: 'about_image', type: 'background_image', section: 'about', value: 'https://images.unsplash.com/photo-1721305250037-c765d5435cb1' }
    ]
  };

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
                        <Input
                          type="text"
                          value={pendingChanges[config.id] ?? config.value}
                          className="w-32"
                          placeholder="#000000"
                          pattern="^#[0-9A-Fa-f]{6}$"
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
                              handleInputChange(config.id, value);
                            } else if (value.match(/^[0-9A-Fa-f]{6}$/)) {
                              handleInputChange(config.id, `#${value}`);
                            }
                          }}
                        />
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

function GalleryManager() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const { toast } = useToast();

  const { data: images, isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery-images"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Omit<GalleryImage, "id" | "createdAt">) => {
      await apiRequest("POST", "/api/gallery-images", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery-images"] });
      toast({ title: "Image added successfully" });
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add image",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<GalleryImage> }) => {
      await apiRequest("PATCH", `/api/gallery-images/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery-images"] });
      toast({ title: "Image updated successfully" });
      setSelectedImage(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/gallery-images/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery-images"] });
      toast({ title: "Image deleted successfully" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orders: { id: number; order: number }[]) => {
      await apiRequest("POST", "/api/gallery-images/reorder", { orders });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery-images"] });
    },
  });

  const handleDrop = async (draggedId: number, targetId: number) => {
    if (!images) return;

    const draggedIndex = images.findIndex(img => img.id === draggedId);
    const targetIndex = images.findIndex(img => img.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedImage);

    const orders = newImages.map((img, index) => ({
      id: img.id,
      order: index,
    }));

    await reorderMutation.mutateAsync(orders);
  };

  if (isLoading) return <Loader2 className="h-8 w-8 animate-spin" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gallery Management</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>Add Image</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images?.map((image) => (
          <Card
            key={image.id}
            className="overflow-hidden group"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", image.id.toString());
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const draggedId = parseInt(e.dataTransfer.getData("text/plain"));
              handleDrop(draggedId, image.id);
            }}
          >
            <CardContent className="p-0 relative">
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedImage(image)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(image.id)}
                  >
                    Delete
                  </Button>
                </div>
                <p className="text-white text-sm">{image.credit}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="text-foreground">
          <DialogHeader>
            <DialogTitle>Add New Image</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createMutation.mutate({
                url: formData.get("url") as string,
                alt: formData.get("alt") as string || undefined,
                credit: formData.get("credit") as string || undefined,
                order: images?.length || 0,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="url" className="text-foreground">Image URL</Label>
              <Input
                id="url"
                name="url"
                type="url"
                placeholder="https://example.com/image.jpg"
                required
                className="text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alt" className="text-foreground">Alt Text (Optional)</Label>
              <Input
                id="alt"
                name="alt"
                placeholder="Description of the image"
                className="text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit" className="text-foreground">Photo Credit (Optional)</Label>
              <Input
                id="credit"
                name="credit"
                placeholder="Photographer or source"
                className="text-foreground"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="text-foreground"
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Image
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="text-foreground">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateMutation.mutate({
                  id: selectedImage.id,
                  data: {
                    url: formData.get("url") as string,
                    alt: formData.get("alt") as string,
                    credit: formData.get("credit") as string,
                  },
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-url" className="text-foreground">Image URL</Label>
                <Input
                  id="edit-url"
                  name="url"
                  type="url"
                  defaultValue={selectedImage.url}
                  required
                  className="text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-alt" className="text-foreground">Alt Text</Label>
                <Input
                  id="edit-alt"
                  name="alt"
                  defaultValue={selectedImage.alt}
                  className="text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-credit" className="text-foreground">Photo Credit</Label>
                <Input
                  id="edit-credit"
                  name="credit"
                  defaultValue={selectedImage.credit}
                  className="text-foreground"
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="text-foreground"
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDashboard;