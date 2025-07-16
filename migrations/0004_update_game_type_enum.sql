-- Update gameType column to use enum values
-- First, update existing 'standard' values to 'classic' (the most common case)
UPDATE
    games
SET
    gameType = 'classic'
WHERE
    gameType = 'standard';

-- Then alter the column to use the enum constraint
-- Note: SQLite doesn't support ALTER COLUMN with enum constraints directly
-- We'll need to recreate the table or handle this in the application layer
-- For now, we'll just update the default value in the schema