import { Card, CardContent } from "@/components/ui/card";
import { useDesignContext } from "@/providers/design-config-provider";

const galleryImages = [
  {
    url: "https://images.unsplash.com/photo-1479767574301-a01c78234a0c",
    alt: "Arm tattoo design",
    credit: "Photo by Matheus Ferrero"
  },
  {
    url: "https://images.unsplash.com/photo-1567071208639-716c1009517d",
    alt: "Detailed tattoo work",
    credit: "Photo by Maixent Viau"
  },
  {
    url: "https://images.unsplash.com/photo-1603162610423-af7febeca563",
    alt: "Custom tattoo design",
    credit: "Photo by Loren Cutler"
  },
  {
    url: "https://images.unsplash.com/photo-1605925575028-eb8b33197733",
    alt: "Artistic tattoo piece",
    credit: "Photo by Abstral Official"
  },
  {
    url: "https://images.unsplash.com/photo-1604374168824-4eab4b9d50fd",
    alt: "Traditional tattoo style",
    credit: "Photo by Seyi Ariyo"
  },
  {
    url: "https://images.unsplash.com/photo-1543244128-30d70d41e2a9",
    alt: "Modern tattoo design",
    credit: "Photo by Luis Villasmil"
  },
  {
    url: "https://images.unsplash.com/photo-1734552452939-7d9630889748",
    alt: "Vintage tattoo art",
    credit: "Photo by The New York Public Library"
  },
  {
    url: "https://images.unsplash.com/photo-1734623044339-e8d370c1a0e1",
    alt: "Classic tattoo design",
    credit: "Photo by The New York Public Library"
  }
];

export default function GalleryPage() {
  const { getConfigValue } = useDesignContext();
  const galleryTitle = getConfigValue("gallery_title", "Our Gallery");
  const galleryDescription = getConfigValue("gallery_description", "Browse through our collection of unique tattoo designs and custom artwork");
  const galleryDescriptionColor = getConfigValue("gallery_description_color", "#6b7280");

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{galleryTitle}</h1>
        <p className="text-lg" style={{ color: galleryDescriptionColor }}>
          {galleryDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleryImages.map((image, index) => (
          <Card key={index} className="overflow-hidden group">
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