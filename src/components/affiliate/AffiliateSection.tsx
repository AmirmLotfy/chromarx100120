import { Card } from "@/components/ui/card";
import AffiliateCard from "./AffiliateCard";
import { Info } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const FEATURED_PRODUCT = {
  id: "1",
  title: "Premium Password Manager",
  description: "Secure all your passwords with military-grade encryption. Perfect for managing multiple accounts safely. Includes features like password generation, secure sharing, and cross-device sync.",
  imageUrl: "/placeholder.svg",
  affiliateUrl: "https://example.com/password-manager",
  price: "$2.99/month"
};

const SAMPLE_PRODUCTS = [
  FEATURED_PRODUCT,
  {
    id: "2",
    title: "Cloud Storage Plus",
    description: "Never lose your important files again with our enterprise-grade cloud storage solution. Features automatic backup, cross-device sync, and advanced sharing capabilities.",
    imageUrl: "/placeholder.svg",
    affiliateUrl: "https://example.com/cloud-storage",
    price: "$5.99/month"
  },
  {
    id: "3",
    title: "VPN Service",
    description: "Browse securely and privately with our recommended VPN service. Access content from anywhere with military-grade encryption and no-logs policy.",
    imageUrl: "/placeholder.svg",
    affiliateUrl: "https://example.com/vpn",
    price: "$4.99/month"
  },
  {
    id: "4",
    title: "Antivirus Pro",
    description: "Protect your devices from malware and cyber threats with real-time protection and advanced security features.",
    imageUrl: "/placeholder.svg",
    affiliateUrl: "https://example.com/antivirus",
    price: "$3.99/month"
  }
];

const AffiliateSection = ({ showAll = false }) => {
  const products = showAll ? SAMPLE_PRODUCTS : [FEATURED_PRODUCT];

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
        
        {showAll ? (
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {products.map((product) => (
                <CarouselItem 
                  key={product.id} 
                  className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <AffiliateCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        ) : (
          <div className="max-w-sm mx-auto">
            <AffiliateCard product={FEATURED_PRODUCT} />
          </div>
        )}

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