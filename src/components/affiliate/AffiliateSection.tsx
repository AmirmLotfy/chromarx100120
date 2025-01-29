import { Card } from "@/components/ui/card";
import AffiliateCard from "./AffiliateCard";
import { Info } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const FEATURED_PRODUCT = {
  id: "1",
  title: "Premium Password Manager",
  description: "Secure all your passwords with military-grade encryption. Perfect for managing multiple accounts safely. Includes features like password generation, secure sharing, and cross-device sync.",
  imageUrl: "/placeholder.svg",
  affiliateUrl: "https://example.com/password-manager",
  price: "$2.99/month"
};

const AffiliateSection = () => {
  // Log affiliate link clicks for analytics
  const handleAffiliateClick = (productId: string) => {
    console.log(`Affiliate link clicked: ${productId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <h2 className="text-xl font-semibold">Featured Service</h2>
        <Info className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <Card className="p-4">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            This is an affiliate product that we recommend. We may earn a commission when you purchase through these links.
          </p>
        </div>
        
        <div className="max-w-md mx-auto">
          <AffiliateCard 
            product={FEATURED_PRODUCT} 
          />
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Want to see more recommended services? 
            <a href="/suggested-services" className="text-primary hover:text-primary/80 ml-1">
              View all suggestions
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AffiliateSection;