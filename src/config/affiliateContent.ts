export interface AffiliateProduct {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
  price: string;
  featured?: boolean;
  showOnHome?: boolean;
}

export interface FeaturedService {
  id: string;
  title: string;
  imageUrl: string;
  affiliateUrl: string;
}

// You can edit these arrays to control what appears in the banners and services page
export const affiliateProducts: AffiliateProduct[] = [
  {
    id: "1",
    title: "1Password - Password Manager",
    description: "Secure password management for individuals and families. Store unlimited passwords, create strong passwords, and auto-fill credentials across all your devices.",
    imageUrl: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7",
    affiliateUrl: "https://1password.com/",
    price: "$2.99/month",
    featured: true,
    showOnHome: true
  },
  {
    id: "2",
    title: "Dropbox Plus",
    description: "2TB of secure cloud storage with automatic backup, file sync across devices, and advanced sharing features.",
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
    affiliateUrl: "https://www.dropbox.com/",
    price: "$11.99/month",
    featured: true
  },
  {
    id: "3",
    title: "NordVPN",
    description: "Premium VPN service with military-grade encryption, 5500+ servers worldwide, and no-logs policy.",
    imageUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e",
    affiliateUrl: "https://nordvpn.com/",
    price: "$3.99/month",
    showOnHome: true
  },
  {
    id: "4",
    title: "Norton 360 Deluxe",
    description: "Complete digital protection with antivirus, VPN, password manager, and cloud backup.",
    imageUrl: "https://images.unsplash.com/photo-1500673922987-e212871fec22",
    affiliateUrl: "https://norton.com/",
    price: "$4.99/month"
  }
];

// Featured services for the compact banner
export const featuredServices: FeaturedService[] = affiliateProducts
  .filter(product => product.showOnHome)
  .map(({ id, title, imageUrl, affiliateUrl }) => ({
    id,
    title,
    imageUrl,
    affiliateUrl
  }));

// Get products to show on home page
export const getHomePageProducts = () => 
  affiliateProducts.filter(product => product.featured);

// Get all products for services page
export const getAllProducts = () => affiliateProducts;