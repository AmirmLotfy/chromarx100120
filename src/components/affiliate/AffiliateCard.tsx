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

  // Auto flip every 5 seconds
  useEffect(() => {
    const flipInterval = setInterval(() => {
      setIsFlipped((prev) => !prev);
    }, 5000);

    return () => clearInterval(flipInterval);
  }, []);

  return (
    <div className="relative w-full h-[400px] sm:h-[450px] perspective-1000">
      <div
        className={`w-full h-full transition-transform duration-1000 transform-style-3d relative ${
          isFlipped ? "rotate-x-180" : ""
        }`}
      >
        {/* Front of card */}
        <Card className="absolute w-full h-full backface-hidden bg-gradient-to-br from-accent to-primary/10 p-6">
          <div className="h-full flex flex-col">
            <div className="relative h-48 sm:h-56 mb-4 overflow-hidden rounded-lg">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="absolute top-2 right-2 bg-background/90 p-1.5 rounded-full shadow-lg hover:bg-background/95 transition-colors">
                      <Info className="h-4 w-4 text-primary" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Card will flip to show more details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <h3 className="font-semibold text-xl mb-2 text-foreground line-clamp-2">{product.title}</h3>
            <div className="mt-auto">
              <p className="text-primary font-bold text-lg">{product.price}</p>
            </div>
          </div>
        </Card>

        {/* Back of card */}
        <Card className="absolute w-full h-full backface-hidden rotate-x-180 bg-gradient-to-br from-primary/5 to-accent p-6">
          <div className="h-full flex flex-col">
            <h3 className="font-semibold text-xl mb-4 text-foreground line-clamp-2">{product.title}</h3>
            <p className="text-muted-foreground text-base flex-grow overflow-auto">
              {product.description}
            </p>
            <div className="mt-6">
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium bg-accent/50 px-4 py-2 rounded-lg transition-colors hover:bg-accent w-full justify-center"
                onClick={() => {
                  console.log(`Affiliate link clicked: ${product.id}`);
                }}
              >
                Learn More
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AffiliateCard;