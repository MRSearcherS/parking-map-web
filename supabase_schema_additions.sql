-- Добавить таблицу payments
CREATE TABLE IF NOT EXISTS public.payments (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RUB',
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_user_idx ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS payments_provider_idx ON public.payments(provider_payment_id);
