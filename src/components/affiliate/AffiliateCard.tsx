import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

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
    // Set up auto-flip interval
    const flipInterval = setInterval(() => {
      setIsFlipped((prev) => !prev);
    }, 5000); // Flip every 5 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(flipInterval);
  }, []);

  return (
    <div className="relative w-full h-[400px] perspective-1000">
      <div
        className={`w-full h-full transition-all duration-700 transform-style-3d relative ${
          isFlipped ? "rotate-x-180" : ""
        }`}
      >
        {/* Front of card */}
        <Card className="absolute w-full h-full backface-hidden bg-gradient-to-br from-[#F1F0FB] to-white border-none shadow-lg">
          <div className="p-4 h-full flex flex-col">
            <div className="relative h-48 mb-4 overflow-hidden rounded-lg group">
              <img
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <h3 className="font-semibold text-lg text-foreground line-clamp-2 mb-2">
              {product.title}
            </h3>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-primary font-bold text-xl">{product.price}</span>
              <div className="text-xs text-muted-foreground bg-accent/50 px-3 py-1 rounded-full">
                Auto-flipping...
              </div>
            </div>
          </div>
        </Card>

        {/* Back of card */}
        <Card className="absolute w-full h-full backface-hidden rotate-x-180 bg-gradient-to-br from-[#E5DEFF] to-white border-none shadow-lg">
          <div className="p-4 h-full flex flex-col">
            <div className="flex-grow">
              <h3 className="font-semibold text-lg text-foreground mb-3">
                {product.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-6">
                {product.description}
              </p>
            </div>
            <div className="mt-4 space-y-3">
              <a
                href={product.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-3 rounded-lg transition-colors"
                onClick={() => {
                  console.log(`Affiliate link clicked: ${product.id}`);
                }}
              >
                View Details
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