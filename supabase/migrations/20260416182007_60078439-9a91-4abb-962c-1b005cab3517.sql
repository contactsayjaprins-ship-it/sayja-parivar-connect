-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table keyed by mobile (since this app uses mobile-only auth, no Supabase auth users)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mobile TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mobile, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role by mobile
CREATE OR REPLACE FUNCTION public.has_role_mobile(_mobile TEXT, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE mobile = _mobile AND role = _role
  )
$$;

-- Open policies (mobile-based app, no Supabase auth). Admin enforcement happens in app layer via has_role_mobile checks.
CREATE POLICY "public read roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "public insert roles" ON public.user_roles FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete roles" ON public.user_roles FOR DELETE USING (true);

-- Seed default admin
INSERT INTO public.user_roles (mobile, role) VALUES ('8140805960', 'admin')
ON CONFLICT (mobile, role) DO NOTHING;