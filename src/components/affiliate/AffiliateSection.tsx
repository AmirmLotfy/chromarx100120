import { Card } from "@/components/ui/card";
import AffiliateCard from "./AffiliateCard";
import { Info } from "lucide-react";

const SAMPLE_PRODUCTS = [
  {
    id: "1",
    title: "Premium Password Manager",
    description: "Secure all your passwords with military-grade encryption. Perfect for managing multiple accounts safely.",
    imageUrl: "/placeholder.svg",
    affiliateUrl: "https://example.com/password-manager",
    price: "$2.99/month"
  },
  {
    id: "2",
    title: "Cloud Storage Plus",
    description: "Never lose your important files again. Automatic backup and sync across all devices.",
    imageUrl: "/placeholder.svg",
    affiliateUrl: "https://example.com/cloud-storage",
    price: "$5.99/month"
  },
  {
    id: "3",
    title: "VPN Service",
    description: "Browse securely and privately with our recommended VPN service. Access content from anywhere.",
    imageUrl: "/placeholder.svg",
    affiliateUrl: "https://example.com/vpn",
    price: "$4.99/month"
  }
];

const AffiliateSection = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <h2 className="text-xl font-semibold">Suggested Products</h2>
        <Info className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <Card className="p-4">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            These are affiliate products that we recommend. We may earn a commission when you purchase through these links.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SAMPLE_PRODUCTS.map((product) => (
            <AffiliateCard key={product.id} product={product} />
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AffiliateSection;