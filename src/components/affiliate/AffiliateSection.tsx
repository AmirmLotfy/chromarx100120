import { Card } from "@/components/ui/card";
import AffiliateCard from "./AffiliateCard";
import { Info } from "lucide-react";

// You can edit the product information here
const SAMPLE_PRODUCTS = [
  {
    id: "1",
    title: "1Password - Password Manager",
    description: "Secure password management for individuals and families. Store unlimited passwords, create strong passwords, and auto-fill credentials across all your devices. Includes secure document storage and password sharing.",
    imageUrl: "/placeholder.svg", // Replace with actual product image
    affiliateUrl: "https://1password.com/",
    price: "$2.99/month"
  },
  {
    id: "2",
    title: "Dropbox Plus",
    description: "2TB of secure cloud storage with automatic backup, file sync across devices, and advanced sharing features. Access your files anywhere, collaborate with others, and protect your important documents.",
    imageUrl: "/placeholder.svg", // Replace with actual product image
    affiliateUrl: "https://www.dropbox.com/",
    price: "$11.99/month"
  },
  {
    id: "3",
    title: "NordVPN",
    description: "Premium VPN service with military-grade encryption, 5500+ servers worldwide, and no-logs policy. Stream content globally, protect your privacy, and secure your online activities.",
    imageUrl: "/placeholder.svg", // Replace with actual product image
    affiliateUrl: "https://nordvpn.com/",
    price: "$3.99/month"
  },
  {
    id: "4",
    title: "Norton 360 Deluxe",
    description: "Complete digital protection with antivirus, VPN, password manager, and cloud backup. Real-time protection against malware, ransomware, and online threats for up to 5 devices.",
    imageUrl: "/placeholder.svg", // Replace with actual product image
    affiliateUrl: "https://norton.com/",
    price: "$4.99/month"
  },
  {
    id: "5",
    title: "Backblaze",
    description: "Unlimited cloud backup for your computer with automatic backup, external drive support, and file versioning. Restore files easily, locate lost devices, and protect your data with enterprise-grade encryption.",
    imageUrl: "/placeholder.svg", // Replace with actual product image
    affiliateUrl: "https://www.backblaze.com/",
    price: "$7/month"
  }
];

const AffiliateSection = ({ showAll = false }) => {
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
          <AffiliateCard products={SAMPLE_PRODUCTS} />
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