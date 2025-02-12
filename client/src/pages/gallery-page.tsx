import { Card, CardContent } from "@/components/ui/card";
import { useDesignContext } from "@/providers/design-config-provider";
import { useQuery } from "@tanstack/react-query";
import type { GalleryImage } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function GalleryPage() {
  const { getConfigValue } = useDesignContext();
  const galleryTitle = getConfigValue("gallery_title", "Our Gallery");
  const galleryDescription = getConfigValue("gallery_description", "Browse through our collection of unique tattoo designs and custom artwork");
  const galleryDescriptionColor = getConfigValue("gallery_description_color", "#6b7280");

  const { data: images, isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery-images"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{galleryTitle}</h1>
        <p className="text-lg" style={{ color: galleryDescriptionColor }}>
          {galleryDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {images?.map((image) => (
          <Card key={image.id} className="overflow-hidden group">
            <CardContent className="p-0 relative">
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <p className="text-white text-sm">{image.credit}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}