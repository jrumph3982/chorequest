-- Add color column to Companion for pet SVG rendering
ALTER TABLE "Companion" ADD COLUMN "color" TEXT NOT NULL DEFAULT '#c87a3a';
