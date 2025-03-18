export interface PaymentHistory {
  id: string;
  user_id?: string;
  order_id: string;
  plan_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  provider: string;
  auto_renew: boolean;
  created_at: string;
  updated_at?: string;
  billing_cycle?: 'monthly' | 'yearly';
  type?: 'initial' | 'renewal' | 'upgrade' | 'billing_cycle_change';
  receipt_url?: string;
  invoice_pdf?: string;
}

export interface SubscriptionDetails {
  id: string;
  plan_id: string;
  status: 'active' | 'inactive' | 'canceled' | 'expired' | 'past_due' | 'grace_period';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  auto_renew: boolean;
  billing_cycle: 'monthly' | 'yearly';
  grace_period_end_date?: string;
  payment_method?: PaymentMethod;
  usage: {
    bookmarks: number;
    bookmarkImports: number;
    bookmarkCategorization: number;
    bookmarkSummaries: number;
    keywordExtraction: number;
    tasks: number;
    taskEstimation: number;
    notes: number;
    noteSentimentAnalysis: number;
    aiRequests: number;
  };
}

export interface PaymentMethod {
  type: 'card' | 'paypal';
  last_four?: string;
  brand?: string;
  expiry_month?: number;
  expiry_year?: number;
}

export interface PayPalConfig {
  configured: boolean;
  clientId: string;
  mode: 'sandbox' | 'production';
}

export interface Usage {
  bookmarks: number;
  bookmarkImports: number;
  bookmarkCategorization: number;
  bookmarkSummaries: number;
  keywordExtraction: number;
  tasks: number;
  taskEstimation: number;
  notes: number;
  noteSentimentAnalysis: number;
  aiRequests: number;
}

export interface UsageMetrics {
  bookmarks: UsageMetric;
  bookmarkImports: UsageMetric;
  bookmarkCategorization: UsageMetric;
  bookmarkSummaries: UsageMetric;
  keywordExtraction: UsageMetric;
  tasks: UsageMetric;
  taskEstimation: UsageMetric;
  notes: UsageMetric;
  noteSentimentAnalysis: UsageMetric;
  aiRequests: UsageMetric;
}

export interface UsageMetric {
  limit: number;
  used: number;
  percentage: number;
}

export interface InvoiceData {
  invoice_number: string;
  created_at: string;
  due_date: string;
  status: 'paid' | 'unpaid' | 'void';
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  customer: {
    name: string;
    email: string;
    address?: string;
  };
  payment_method: PaymentMethod;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  pricing: {
    monthly: number;
    yearly: number;
  };
  popular?: boolean;
  limits: {
    bookmarks: number;
    bookmarkImports: number;
    bookmarkCategorization: number;
    bookmarkSummaries: number;
    keywordExtraction: number;
    tasks: number;
    taskEstimation: number;
    notes: number;
    noteSentimentAnalysis: number;
    aiRequests: number;
  };
}
