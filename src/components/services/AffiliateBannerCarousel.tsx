import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { defaultAffiliateBanners } from "@/config/affiliateContent";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AffiliateBannerCarousel = () => {
  const [currentBanners, setCurrentBanners] = useState(defaultAffiliateBanners);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const shuffledBanners = [...defaultAffiliateBanners].sort(() => Math.random() - 0.5);
    setCurrentBanners(shuffledBanners);
    setIsLoading(false);

    const intervalId = setInterval(() => {
      setCurrentBanners(prev => [...prev].sort(() => Math.random() - 0.5));
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  const handleBannerClick = (url: string, title: string) => {
    console.log(`Banner clicked: ${title}`);
    window.open(url, '_blank');
  };

  const handleDismiss = () => {
    navigate('/subscription');
  };

  if (isLoading) {
    return (
      <div className="h-32 flex items-center justify-center mt-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden shadow-md mt-6 mb-4">
      <Button
        variant="secondary"
        size="sm"
        className="absolute top-2 right-2 z-10 bg-background/95 hover:bg-background/100 shadow-md"
        onClick={handleDismiss}
      >
        Remove Ads
      </Button>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {currentBanners.map((banner) => (
            <CarouselItem key={banner.id} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <div 
                  className={cn(
                    "relative group h-32 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer",
                    "bg-gradient-to-r from-primary/5 to-primary/10"
                  )}
                  onClick={() => handleBannerClick(banner.affiliateUrl, banner.title)}
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url(${banner.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 flex flex-col justify-center p-4 group-hover:bg-black/40 transition-colors">
                    <h3 className="text-white font-semibold text-base mb-1 line-clamp-1">
                      {banner.title}
                    </h3>
                    <p className="text-white/90 text-sm line-clamp-1 mb-2">
                      {banner.description}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto opacity-90 group-hover:opacity-100 mt-auto"
                    >
                      Learn More
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

export default AffiliateBannerCarousel;