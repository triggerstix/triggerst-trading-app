CREATE TABLE `chart_drawings` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`drawingData` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chart_drawings_id` PRIMARY KEY(`id`)
);
