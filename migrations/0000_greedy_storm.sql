CREATE TABLE `game_moves` (
	`id` text PRIMARY KEY NOT NULL,
	`gameId` text NOT NULL,
	`moveIndex` integer NOT NULL,
	`player` text NOT NULL,
	`diceRoll` integer NOT NULL,
	`pieceIndex` integer NOT NULL,
	`fromSquare` integer NOT NULL,
	`toSquare` integer NOT NULL,
	`moveType` text NOT NULL,
	FOREIGN KEY (`gameId`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`clientVersion` text DEFAULT 'unknown' NOT NULL,
	`winner` text,
	`createdAt` integer NOT NULL,
	`completedAt` integer,
	`status` text DEFAULT 'in_progress' NOT NULL
);
