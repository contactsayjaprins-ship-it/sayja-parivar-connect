ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS surname text NOT NULL DEFAULT 'સાયજા',
  ADD COLUMN IF NOT EXISTS form_photo text DEFAULT '';