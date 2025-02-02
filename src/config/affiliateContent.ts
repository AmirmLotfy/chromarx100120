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

export const defaultAffiliateProducts: AffiliateProduct[] = [];