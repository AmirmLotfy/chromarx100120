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
    imageUrl: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7",
    affiliateUrl: "https://example.com/vpn",
  },
  {
    id: "2",
    title: "Cloud Storage Solution",
    description: "Store and access your files from anywhere, anytime",
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
    affiliateUrl: "https://example.com/storage",
  },
  {
    id: "3",
    title: "Password Manager",
    description: "Keep your passwords secure and easily accessible",
    imageUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b",
    affiliateUrl: "https://example.com/password",
  },
  {
    id: "4",
    title: "Productivity Suite",
    description: "Boost your productivity with integrated tools",
    imageUrl: "https://images.unsplash.com/photo-1527576539890-dfa815648363",
    affiliateUrl: "https://example.com/productivity",
  },
  {
    id: "5",
    title: "Website Builder",
    description: "Create professional websites without coding",
    imageUrl: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7",
    affiliateUrl: "https://example.com/builder",
  },
];

export const defaultAffiliateProducts: AffiliateProduct[] = [];