import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { featuredServices } from "@/config/affiliateContent";

const CompactServiceBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const flipInterval = setInterval(() => {
      setIsFlipped((prev) => !prev);
    }, 3000);

    return () => clearInterval(flipInterval);
  }, []);

  useEffect(() => {
    const productInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredServices.length);
      setIsFlipped(false);
    }, 6000);

    return () => clearInterval(productInterval);
  }, []);

  const currentService = featuredServices[currentIndex];

  return (
    <div className="relative h-24 sm:h-32 mb-4 perspective-1000 mx-2 sm:mx-4">
      <div
        className={`w-full h-full transition-all duration-700 transform-style-3d relative ${
          isFlipped ? "rotate-x-180" : ""
        }`}
      >
        <Card className="absolute w-full h-full backface-hidden overflow-hidden rounded-lg">
          <div className="relative w-full h-full">
            <img
              src={currentService.imageUrl}
              alt={currentService.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-3 text-white">
              <h3 className="text-base sm:text-lg font-semibold">{currentService.title}</h3>
            </div>
          </div>
        </Card>

        <Card className="absolute w-full h-full backface-hidden rotate-x-180 overflow-hidden rounded-lg bg-gradient-to-r from-accent to-primary/10">
          <div className="p-3 sm:p-4 h-full flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base sm:text-lg text-foreground mb-1">
                {currentService.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Click to learn more about this service
              </p>
            </div>
            <a
              href={currentService.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center gap-1 text-primary hover:text-primary/90 transition-colors"
              onClick={() => {
                console.log(`Banner affiliate link clicked: ${currentService.id}`);
              }}
            >
              <span className="text-sm sm:text-base">Visit</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompactServiceBanner;