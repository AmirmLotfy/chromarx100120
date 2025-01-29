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
  products: AffiliateProduct[];
}

const AffiliateCard = ({ products }: AffiliateCardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const flipInterval = setInterval(() => {
      setIsFlipped((prev) => !prev);
    }, 5000);

    return () => clearInterval(flipInterval);
  }, []);

  useEffect(() => {
    const productInterval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
      setIsFlipped(false);
    }, 10000); // Change product every 10 seconds (2 flips per product)

    return () => clearInterval(productInterval);
  }, [products.length]);

  const currentProduct = products[currentIndex];

  return (
    <div className="relative w-full h-[400px] perspective-1000">
      <div
        className={`w-full h-full transition-all duration-700 transform-style-3d relative ${
          isFlipped ? "rotate-x-180" : ""
        }`}
      >
        {/* Front of card */}
        <Card className="absolute w-full h-full backface-hidden bg-gradient-to-br from-[#F1F0FB] to-white dark:from-gray-800 dark:to-gray-900 border-none shadow-lg rounded-xl">
          <div className="p-6 h-full flex flex-col">
            <div className="relative h-48 mb-4 overflow-hidden rounded-lg">
              <img
                src={currentProduct.imageUrl}
                alt={currentProduct.title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2">
              {currentProduct.title}
            </h3>
            <div className="mt-auto flex items-center justify-between">
              <span className="text-primary font-bold text-xl">{currentProduct.price}</span>
              <div className="text-xs text-muted-foreground bg-accent/50 px-3 py-1 rounded-full">
                {`${currentIndex + 1} of ${products.length}`}
              </div>
            </div>
          </div>
        </Card>

        {/* Back of card */}
        <Card className="absolute w-full h-full backface-hidden rotate-x-180 bg-gradient-to-br from-[#E5DEFF] to-white dark:from-gray-900 dark:to-gray-800 border-none shadow-lg rounded-xl">
          <div className="p-6 h-full flex flex-col">
            <div className="flex-grow">
              <h3 className="font-semibold text-lg text-foreground mb-3">
                {currentProduct.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-6">
                {currentProduct.description}
              </p>
            </div>
            <div className="mt-4 space-y-3">
              <a
                href={currentProduct.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-3 rounded-lg transition-colors"
                onClick={() => {
                  console.log(`Affiliate link clicked: ${currentProduct.id}`);
                }}
              >
                View Details
                <ExternalLink className="h-4 w-4" />
              </a>
              <div className="text-xs text-center text-muted-foreground">
                {`${currentIndex + 1} of ${products.length}`}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AffiliateCard;