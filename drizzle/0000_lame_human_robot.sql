CREATE TABLE `question_bank` (
	`id` varchar(32) NOT NULL,
	`area` varchar(64) NOT NULL,
	`grade` int NOT NULL,
	`subject` enum('數學','自然','社會','國語') NOT NULL,
	`difficulty` enum('基礎','標準','挑戰') NOT NULL,
	`curriculumDomain` enum('語文領域','數學領域','自然科學領域','社會領域') NOT NULL,
	`learningTopic` varchar(255) NOT NULL,
	`learningPerformance` text NOT NULL,
	`learningContent` text NOT NULL,
	`competency` text NOT NULL,
	`prompt` text NOT NULL,
	`options` json NOT NULL,
	`answer` int NOT NULL,
	`explanation` text NOT NULL,
	`knowledge` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `question_bank_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
