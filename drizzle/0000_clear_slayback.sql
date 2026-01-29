CREATE TABLE `watchlist` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `watchlist_id` PRIMARY KEY(`id`)
);
