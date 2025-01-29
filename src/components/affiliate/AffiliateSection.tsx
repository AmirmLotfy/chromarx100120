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
    <div className="space-y-6">
      <div className="flex items-start gap-2">
        <h2 className="text-2xl font-bold tracking-tight">
          {showAll ? "Recommended Services" : "Featured Service"}
        </h2>
        <Info className="h-6 w-6 text-muted-foreground" />
      </div>
      
      <Card className="p-4 sm:p-6 bg-gradient-to-br from-accent/50 to-background">
        <div className="mb-6">
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
            <CarouselContent className="-ml-2 md:-ml-4">
              {products.map((product) => (
                <CarouselItem key={product.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <AffiliateCard product={product} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden sm:block">
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </div>
          </Carousel>
        ) : (
          <div className="max-w-md mx-auto">
            <AffiliateCard product={FEATURED_PRODUCT} />
          </div>
        )}

        {!showAll && (
          <div className="mt-6 text-center">
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