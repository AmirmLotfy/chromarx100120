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
    <div className="relative h-32 sm:h-40 mb-6 perspective-1000 mx-4 sm:mx-6">
      <div
        className={`w-full h-full transition-all duration-700 transform-style-3d relative ${
          isFlipped ? "rotate-x-180" : ""
        }`}
      >
        <Card className="absolute w-full h-full backface-hidden overflow-hidden rounded-xl shadow-lg border-primary/20">
          <div className="relative w-full h-full">
            <img
              src={currentService.imageUrl}
              alt={currentService.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-lg sm:text-xl font-semibold tracking-tight">{currentService.title}</h3>
            </div>
          </div>
        </Card>

        <Card className="absolute w-full h-full backface-hidden rotate-x-180 overflow-hidden rounded-xl border-primary/20 bg-gradient-to-br from-accent via-primary/5 to-primary/10">
          <div className="p-4 sm:p-6 h-full flex items-center justify-between">
            <div className="space-y-2.5">
              <h3 className="font-semibold text-lg sm:text-xl text-foreground">
                {currentService.title}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Click to learn more about this service
              </p>
            </div>
            <a
              href={currentService.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors group"
              onClick={() => {
                console.log(`Banner affiliate link clicked: ${currentService.id}`);
              }}
            >
              <span className="text-base sm:text-lg font-medium">Visit</span>
              <ExternalLink className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompactServiceBanner;