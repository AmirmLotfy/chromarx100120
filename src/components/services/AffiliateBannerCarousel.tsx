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
import { ExternalLink, X } from "lucide-react";
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
      <div className="h-28 flex items-center justify-center mt-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden shadow-sm mt-6 mb-4">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 z-10 bg-black/20 hover:bg-black/30 text-white h-6 w-6 p-0 sm:w-auto sm:px-2 sm:h-7"
        onClick={handleDismiss}
      >
        <X className="h-3 w-3 sm:hidden" />
        <span className="hidden sm:inline text-xs">Remove Ads</span>
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
                    "relative group h-28 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer",
                    "bg-gradient-to-r from-primary/5 to-primary/10"
                  )}
                  onClick={() => handleBannerClick(banner.affiliateUrl, banner.title)}
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${banner.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 flex flex-col justify-center p-3 group-hover:bg-black/40 transition-colors">
                    <h3 className="text-white font-semibold text-sm mb-0.5 line-clamp-1">
                      {banner.title}
                    </h3>
                    <p className="text-white/80 text-xs line-clamp-1 mb-1.5">
                      {banner.description}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto opacity-80 group-hover:opacity-100 mt-auto h-7 text-xs"
                    >
                      Learn More
                      <ExternalLink className="ml-1.5 h-3 w-3" />
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