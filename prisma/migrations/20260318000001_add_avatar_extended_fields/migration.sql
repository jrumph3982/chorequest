-- Add extended avatar fields to ChildProfile
ALTER TABLE "ChildProfile" ADD COLUMN "eyeStyle"    TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "freckles"    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ChildProfile" ADD COLUMN "jacketColor" TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "pantsColor"  TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "goggleColor" TEXT;
ALTER TABLE "ChildProfile" ADD COLUMN "sigItem"     TEXT;
