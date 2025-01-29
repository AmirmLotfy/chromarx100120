import { Card } from "@/components/ui/card";
import { useState } from "react";
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

  return (
    <div
      className="relative w-full h-[320px] perspective-1000"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={`w-full h-full transition-transform duration-500 transform-style-3d relative ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front of card */}
        <Card className="absolute w-full h-full backface-hidden bg-card">
          <div className="p-6 h-full flex flex-col">
            <div className="relative h-40 mb-4">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover rounded-md shadow-sm"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="absolute top-2 right-2 bg-background/90 p-1.5 rounded-full shadow-sm">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Hover to see more details</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <h3 className="font-semibold text-lg mb-2 line-clamp-1">{product.title}</h3>
            <p className="text-primary font-medium mt-auto">{product.price}</p>
          </div>
        </Card>

        {/* Back of card */}
        <Card className="absolute w-full h-full backface-hidden rotate-y-180 bg-accent">
          <div className="p-6 h-full flex flex-col">
            <h3 className="font-semibold text-lg mb-3">{product.title}</h3>
            <p className="text-muted-foreground text-sm flex-grow line-clamp-6">
              {product.description}
            </p>
            <div className="mt-4">
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium"
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