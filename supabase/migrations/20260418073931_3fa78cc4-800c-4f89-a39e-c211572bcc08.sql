
-- Add new family fields
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS blood_group text DEFAULT '',
  ADD COLUMN IF NOT EXISTS family_code text,
  ADD COLUMN IF NOT EXISTS category_tag text DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery jsonb DEFAULT '[]'::jsonb;

-- Auto family code sequence
CREATE SEQUENCE IF NOT EXISTS public.family_code_seq START 1;

CREATE OR REPLACE FUNCTION public.assign_family_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.family_code IS NULL OR NEW.family_code = '' THEN
    NEW.family_code := 'SP-' || LPAD(nextval('public.family_code_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_family_code ON public.families;
CREATE TRIGGER trg_assign_family_code
BEFORE INSERT ON public.families
FOR EACH ROW EXECUTE FUNCTION public.assign_family_code();

-- Backfill existing rows
UPDATE public.families
SET family_code = 'SP-' || LPAD(nextval('public.family_code_seq')::text, 4, '0')
WHERE family_code IS NULL OR family_code = '';

-- Family member: blood group
ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS blood_group text DEFAULT '';

-- Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_mobile text NOT NULL,
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_mobile, family_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read favorites" ON public.favorites FOR SELECT USING (true);
CREATE POLICY "public insert favorites" ON public.favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete favorites" ON public.favorites FOR DELETE USING (true);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  event_type text NOT NULL DEFAULT 'function',
  event_date date NOT NULL,
  village text DEFAULT '',
  family_id uuid REFERENCES public.families(id) ON DELETE SET NULL,
  photo text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "public insert events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "public update events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "public delete events" ON public.events FOR DELETE USING (true);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date DESC);

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  doc_type text NOT NULL DEFAULT 'other',
  label text DEFAULT '',
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "public insert documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete documents" ON public.documents FOR DELETE USING (true);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('house-gallery', 'house-gallery', true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('family-documents', 'family-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Public access policies for house-gallery
CREATE POLICY "house gallery read" ON storage.objects FOR SELECT USING (bucket_id = 'house-gallery');
CREATE POLICY "house gallery insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'house-gallery');
CREATE POLICY "house gallery delete" ON storage.objects FOR DELETE USING (bucket_id = 'house-gallery');

-- Document access (open per app's current public model — can be tightened later)
CREATE POLICY "documents read" ON storage.objects FOR SELECT USING (bucket_id = 'family-documents');
CREATE POLICY "documents insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'family-documents');
CREATE POLICY "documents delete" ON storage.objects FOR DELETE USING (bucket_id = 'family-documents');
