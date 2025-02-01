import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ExternalLink, X } from "lucide-react";
import { featuredServices } from "@/config/affiliateContent";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const CompactServiceBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredServices.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentService = featuredServices[currentIndex];

  const handleBannerClick = () => {
    window.open(currentService.affiliateUrl, '_blank', 'noopener,noreferrer');
    console.log(`Banner affiliate link clicked: ${currentService.id}`);
  };

  return (
    <div className="relative h-32 mb-4 mx-2 sm:mx-4 max-w-4xl w-full animate-fade-in">
      <Card 
        className="group relative w-full h-full overflow-hidden rounded-xl border-primary/20 transition-all duration-500 bg-gradient-to-br from-primary/20 via-accent to-background cursor-pointer shadow-md hover:shadow-lg"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleBannerClick}
      >
        <div className="absolute inset-0">
          <img
            src={currentService.imageUrl}
            alt={currentService.title}
            className="w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
          />
        </div>

        <div className="relative z-20 h-full flex items-center justify-between p-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-xs font-medium text-foreground uppercase tracking-wider">
                Featured Service
              </p>
            </div>
            <h3 className="text-lg font-bold text-foreground tracking-tight line-clamp-1">
              {currentService.title}
            </h3>
            
            <div className="flex gap-2 mt-1">
              {featuredServices.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 w-4 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? "bg-primary"
                      : "bg-foreground/30"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end justify-center h-full">
            <a
              href={currentService.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group/link flex items-center gap-1.5 bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                console.log(`Learn More button clicked: ${currentService.id}`);
              }}
            >
              <span className="text-sm font-medium text-primary-foreground">
                Learn More
              </span>
              <ExternalLink 
                className="h-3.5 w-3.5 text-primary-foreground transition-transform group-hover/link:translate-x-0.5" 
              />
            </a>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-2 right-2 text-xs text-foreground/90 hover:text-foreground hover:bg-foreground/10"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/subscription');
          }}
        >
          Remove Ads
          <X className="ml-1 h-3 w-3" />
        </Button>
      </Card>
    </div>
  );
};

export default CompactServiceBanner;