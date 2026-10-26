CREATE TABLE `member_sessions` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `member_sessions_owner` ON `member_sessions` (`owner_id`);--> statement-breakpoint
CREATE INDEX `member_sessions_expiry` ON `member_sessions` (`expires_at`);