
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

export const defaultAffiliateBanners: AffiliateBanner[] = [];

export const defaultAffiliateProducts: AffiliateProduct[] = [];
