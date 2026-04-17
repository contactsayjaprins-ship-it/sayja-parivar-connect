
ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS gov_job text NOT NULL DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS gov_job_place text NOT NULL DEFAULT '';

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS gov_job text NOT NULL DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS gov_job_place text NOT NULL DEFAULT '';
