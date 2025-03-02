
-- Create payment_history table
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  order_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL,
  provider TEXT NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for payment_history
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own payment history
CREATE POLICY "Users can view their own payment history" 
  ON public.payment_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Service role can insert payment history
CREATE POLICY "Service role can insert payment history" 
  ON public.payment_history 
  FOR INSERT 
  WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER set_payment_history_updated_at
  BEFORE UPDATE ON public.payment_history
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Add index to improve query performance
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_order_id ON public.payment_history(order_id);
