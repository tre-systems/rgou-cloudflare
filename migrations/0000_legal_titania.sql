CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`playerId` text NOT NULL,
	`winner` text,
	`completedAt` integer,
	`moveCount` integer,
	`duration` integer,
	`clientHeader` text,
	`history` text,
	`gameType` text DEFAULT 'classic' NOT NULL
);
