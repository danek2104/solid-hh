-- Remove NOT NULL constraint from first_name as it's not required for company profiles
ALTER TABLE users ALTER COLUMN first_name DROP NOT NULL;
