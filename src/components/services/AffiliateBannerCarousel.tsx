
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
import { ArrowRight, ExternalLink, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { type CarouselApi } from "@/components/ui/carousel";

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
      <div className="h-40 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-violet-50/30 to-indigo-50/30 dark:from-slate-900/50 dark:to-slate-800/50 p-2">
      <Button
        variant="secondary"
        size="sm"
        className="absolute top-3 right-3 z-10 bg-black/10 hover:bg-black/20 text-white h-7 w-7 p-0 rounded-full shadow-md"
        onClick={handleDismiss}
      >
        <X className="h-3.5 w-3.5" />
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
                    "relative group h-36 sm:h-40 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer",
                    activeIndex === index ? "ring-2 ring-primary/40 shadow-lg" : ""
                  )}
                  onClick={() => handleBannerClick(banner.affiliateUrl, banner.title)}
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.35)), url(${banner.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 flex flex-col justify-center p-4 group-hover:bg-black/20 transition-colors">
                    <div className="flex flex-col h-full">
                      <div className="mb-auto">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/80 text-white mb-2">
                          Premium
                        </span>
                      </div>
                      
                      <div className="mt-auto space-y-1.5">
                        <h3 className="text-white font-semibold text-base tracking-tight line-clamp-1">
                          {banner.title}
                        </h3>
                        <p className="text-white/90 text-xs font-medium line-clamp-2 mb-2.5">
                          {banner.description}
                        </p>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 px-3 text-xs font-medium bg-white/90 hover:bg-white text-primary shadow-sm group-hover:shadow rounded-lg flex items-center gap-1.5"
                          >
                            Explore
                            <ExternalLink className="h-3 w-3 opacity-70" />
                          </Button>
                          
                          <div className="flex items-center justify-center h-8 w-8 bg-black/20 rounded-full">
                            <ArrowRight className="h-3.5 w-3.5 text-white/90" />
                          </div>
                        </div>
                      </div>
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
                  "h-1.5 rounded-full transition-all duration-300", 
                  activeIndex === index ? "w-4 bg-primary" : "w-1.5 bg-primary/30"
                )}
              />
            ))}
          </div>
        </div>
        
        <CarouselPrevious className="hidden md:flex absolute left-1 -translate-y-1/2 h-7 w-7 opacity-70" />
        <CarouselNext className="hidden md:flex absolute right-1 -translate-y-1/2 h-7 w-7 opacity-70" />
      </Carousel>
    </div>
  );
};

export default AffiliateBannerCarousel;
