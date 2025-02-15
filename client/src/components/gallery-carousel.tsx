import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { GalleryImage } from "@shared/schema";

export default function GalleryCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  const { data: images, isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery-images"],
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (isLoading) {
    return (
      <div className="w-full h-[400px] relative">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!images?.length) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">No gallery images available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative flex-[0_0_100%] min-w-0 pl-4 first:pl-0"
            >
              <div className="group relative aspect-[16/9] overflow-hidden rounded-lg">
                <img
                  src={image.url}
                  alt={image.alt || `Gallery image ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {image.credit && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-sm opacity-0 transition-opacity group-hover:opacity-100">
                    {image.credit}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="outline"
        size="icon"
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm",
          "hover:bg-background/90 transition-all duration-200",
          "hidden md:flex"
        )}
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 backdrop-blur-sm",
          "hover:bg-background/90 transition-all duration-200",
          "hidden md:flex"
        )}
        onClick={scrollNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
