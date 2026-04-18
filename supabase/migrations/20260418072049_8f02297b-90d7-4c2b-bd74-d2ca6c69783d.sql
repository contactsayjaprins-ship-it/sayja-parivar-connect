ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS house_photo text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_families_mobile ON public.families(mobile);
CREATE INDEX IF NOT EXISTS idx_families_native_village ON public.families(native_village);
CREATE INDEX IF NOT EXISTS idx_family_members_family_id ON public.family_members(family_id);