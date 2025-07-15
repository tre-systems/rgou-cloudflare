ALTER TABLE
    games
ADD
    COLUMN gameType text NOT NULL DEFAULT 'standard';

ALTER TABLE
    games
ADD
    COLUMN ai1Version text;

ALTER TABLE
    games
ADD
    COLUMN ai2Version text;

ALTER TABLE
    games
ADD
    COLUMN gameVersion text;