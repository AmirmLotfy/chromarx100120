
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { defaultAffiliateBanners } from "@/config/affiliateContent";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const AffiliateBannerCarousel = () => {
  const [currentBanners, setCurrentBanners] = useState(defaultAffiliateBanners);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const shuffledBanners = [...defaultAffiliateBanners].sort(() => Math.random() - 0.5);
    setCurrentBanners(shuffledBanners);
    setIsLoading(false);

    const intervalId = setInterval(() => {
      setCurrentBanners(prev => [...prev].sort(() => Math.random() - 0.5));
    }, 15000);

    return () => clearInterval(intervalId);
  }, []);

  // Update the active index when the carousel changes
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setActiveIndex(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", onSelect);
    
    // Initial call to set the active index
    setActiveIndex(carouselApi.selectedScrollSnap());

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  const handleBannerClick = (url: string, title: string) => {
    console.log(`Banner clicked: ${title}`);
    window.open(url, '_blank');
  };

  const handleDismiss = () => {
    navigate('/subscription');
  };

  if (isLoading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden bg-background p-1 shadow-sm">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 z-10 h-6 w-6 p-0 rounded-full opacity-70 hover:opacity-100"
        onClick={handleDismiss}
      >
        <X className="h-3 w-3" />
      </Button>
      
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
        setApi={setCarouselApi}
      >
        <CarouselContent>
          {currentBanners.map((banner, index) => (
            <CarouselItem key={banner.id} className="md:basis-1/2 lg:basis-1/3">
              <motion.div 
                initial={{ opacity: 0.8, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-1"
              >
                <div 
                  className={cn(
                    "relative group h-28 rounded-lg overflow-hidden cursor-pointer",
                    activeIndex === index ? "ring-1 ring-primary/40" : ""
                  )}
                  onClick={() => handleBannerClick(banner.affiliateUrl, banner.title)}
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.15)), url(${banner.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 flex flex-col justify-end p-3 group-hover:bg-black/10 transition-colors">
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-white font-medium text-sm tracking-tight mb-0.5">
                          {banner.title}
                        </h3>
                        <p className="text-white/90 text-xs line-clamp-1">
                          {banner.description}
                        </p>
                      </div>
                      
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 w-7 p-0 rounded-full bg-white/80 hover:bg-white text-primary"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="mt-2 flex justify-center">
          <div className="flex items-center space-x-1">
            {currentBanners.map((_, index) => (
              <div 
                key={index}
                className={cn(
                  "h-1 rounded-full transition-all duration-300", 
                  activeIndex === index ? "w-3 bg-primary" : "w-1 bg-primary/20"
                )}
              />
            ))}
          </div>
        </div>
        
        <CarouselPrevious className="hidden md:flex absolute left-1 -translate-y-1/2 h-6 w-6 opacity-60" />
        <CarouselNext className="hidden md:flex absolute right-1 -translate-y-1/2 h-6 w-6 opacity-60" />
      </Carousel>
    </div>
  );
};

export default AffiliateBannerCarousel;
