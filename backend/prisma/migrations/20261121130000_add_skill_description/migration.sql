-- Add optional custom-skill descriptions without changing existing rows.
ALTER TABLE "Skill" ADD COLUMN "description" TEXT;
