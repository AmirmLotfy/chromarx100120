import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { ExternalLink, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AffiliateProduct {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
  price: string;
}

interface AffiliateCardProps {
  product: AffiliateProduct;
}

const AffiliateCard = ({ product }: AffiliateCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const flipInterval = setInterval(() => {
      setIsFlipped((prev) => !prev);
    }, 5000);

    return () => clearInterval(flipInterval);
  }, []);

  return (
    <div className="relative w-full h-[420px] perspective-1000">
      <div
        className={`w-full h-full transition-transform duration-1000 transform-style-3d relative ${
          isFlipped ? "rotate-x-180" : ""
        }`}
      >
        {/* Front of card */}
        <Card className="absolute w-full h-full backface-hidden bg-gradient-to-br from-[#E5DEFF] to-[#F1F0FB] shadow-lg">
          <div className="p-4 sm:p-6 h-full flex flex-col">
            <div className="relative h-44 sm:h-52 mb-4 overflow-hidden rounded-xl">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                      onClick={() => setIsFlipped(true)}
                    >
                      <Info className="h-4 w-4 text-primary" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tap to see more details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <h3 className="font-semibold text-lg sm:text-xl mb-2 text-foreground line-clamp-2">
              {product.title}
            </h3>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-primary font-bold text-lg sm:text-xl">{product.price}</span>
              <span className="text-xs text-muted-foreground">Tap for details</span>
            </div>
          </div>
        </Card>

        {/* Back of card */}
        <Card className="absolute w-full h-full backface-hidden rotate-x-180 bg-gradient-to-br from-[#9b87f5]/10 to-[#E5DEFF] shadow-lg">
          <div className="p-4 sm:p-6 h-full flex flex-col">
            <h3 className="font-semibold text-lg sm:text-xl mb-3 text-foreground line-clamp-2">
              {product.title}
            </h3>
            <div className="flex-grow overflow-auto scrollbar-hide mb-4">
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                {product.description}
              </p>
            </div>
            <div className="mt-auto space-y-3">
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-3 rounded-lg transition-colors"
                onClick={() => {
                  console.log(`Affiliate link clicked: ${product.id}`);
                }}
              >
                Learn More
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                onClick={() => setIsFlipped(false)}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to preview
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AffiliateCard;