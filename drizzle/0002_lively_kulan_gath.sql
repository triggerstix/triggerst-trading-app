CREATE TABLE `analysis_history` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`symbol` varchar(20) NOT NULL,
	`companyName` varchar(255),
	`recommendation` varchar(20),
	`riskLevel` varchar(20),
	`agreement` varchar(10),
	`currentPrice` varchar(20),
	`analyzedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analysis_history_id` PRIMARY KEY(`id`)
);
