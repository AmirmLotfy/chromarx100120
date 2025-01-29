import { Card } from "@/components/ui/card";
import AffiliateCard from "./AffiliateCard";
import { Info } from "lucide-react";
import { getAllProducts, getHomePageProducts } from "@/config/affiliateContent";

const AffiliateSection = ({ showAll = false }) => {
  const products = showAll ? getAllProducts() : getHomePageProducts();

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <h2 className="text-xl font-bold tracking-tight">
          {showAll ? "Recommended Services" : "Featured Service"}
        </h2>
        <Info className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <Card className="p-4 bg-gradient-to-br from-accent/50 to-background overflow-hidden">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {showAll 
              ? "Browse our curated selection of premium services. We may earn a commission when you purchase through these links."
              : "This is an affiliate product that we recommend. We may earn a commission when you purchase through these links."
            }
          </p>
        </div>
        
        <div className="max-w-sm mx-auto">
          <AffiliateCard products={products} />
        </div>

        {!showAll && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Want to see more recommended services? 
              <a href="/suggested-services" className="text-primary hover:text-primary/80 ml-1 font-medium">
                View all suggestions
              </a>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AffiliateSection;