-- 1. Create a sequence for the counter (starts at 1)
CREATE SEQUENCE IF NOT EXISTS informants_friendly_id_seq START 1;

-- 2. Add the column 'friendly_id'
-- We use a trigger or default value. Using DEFAULT with nextval is simplest for Postgres.
ALTER TABLE informants 
ADD COLUMN IF NOT EXISTS friendly_id TEXT;

-- 3. Populate existing rows (if any)
UPDATE informants 
SET friendly_id = 'INFO-' || lpad(nextval('informants_friendly_id_seq')::text, 3, '0')
WHERE friendly_id IS NULL;

-- 4. Set default for new rows
ALTER TABLE informants 
ALTER COLUMN friendly_id SET DEFAULT 'INFO-' || lpad(nextval('informants_friendly_id_seq')::text, 3, '0');

-- 5. Add unique constraint (optional but recommended)
-- ALTER TABLE informants ADD CONSTRAINT informants_friendly_id_key UNIQUE (friendly_id);
-- Commented out solely to prevent errors if duplicates somehow exist during dev, but recommended for prod.
