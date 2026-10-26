CREATE TABLE `access_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`hits` integer NOT NULL,
	`window_end` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`id` text NOT NULL,
	`nickname` text NOT NULL,
	`profile_id` text NOT NULL,
	`family_id` text NOT NULL,
	`contacts_json` text NOT NULL,
	`consent_version` text NOT NULL,
	`adult_confirmed` integer NOT NULL,
	`mode` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_id_unique` ON `members` (`id`);