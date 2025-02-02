export interface AffiliateBanner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
}

export interface AffiliateProduct {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
  price: string;
  featured: boolean;
  showOnHome: boolean;
}

export const defaultAffiliateBanners: AffiliateBanner[] = [
  {
    id: "1",
    title: "Premium VPN Service",
    description: "Secure your online presence with military-grade encryption",
    imageUrl: "/placeholder.svg",
    affiliateUrl: "https://example.com/vpn",
  },
  {
    id: "2",
    title: "Cloud Storage Solution",
    description: "Store and access your files from anywhere, anytime",
    imageUrl: "/placeholder.svg",
    affiliateUrl: "https://example.com/storage",
  },
  {
    id: "3",
    title: "Password Manager",
    description: "Keep your passwords secure and easily accessible",
    imageUrl: "/placeholder.svg",
    affiliateUrl: "https://example.com/password",
  },
  {
    id: "4",
    title: "Productivity Suite",
    description: "Boost your productivity with integrated tools",
    imageUrl: "/placeholder.svg",
    affiliateUrl: "https://example.com/productivity",
  },
  {
    id: "5",
    title: "Website Builder",
    description: "Create professional websites without coding",
    imageUrl: "/placeholder.svg",
    affiliateUrl: "https://example.com/builder",
  },
];

export const defaultAffiliateProducts: AffiliateProduct[] = [];