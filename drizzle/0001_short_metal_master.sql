CREATE TABLE `card_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creditCode` varchar(50) NOT NULL,
	`paymentId` int NOT NULL,
	`remainingCards` int NOT NULL,
	`totalCards` int NOT NULL,
	`email` varchar(320),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `card_credits_id` PRIMARY KEY(`id`),
	CONSTRAINT `card_credits_creditCode_unique` UNIQUE(`creditCode`)
);
--> statement-breakpoint
CREATE TABLE `card_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`previewUrl` text,
	`backgroundColor` varchar(20),
	`accentColor` varchar(20),
	`fontFamily` varchar(100),
	`animationType` enum('snow','lights','stars','none') DEFAULT 'snow',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `card_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(20) NOT NULL,
	`templateId` int NOT NULL,
	`message` text NOT NULL,
	`senderName` varchar(100),
	`recipientName` varchar(100),
	`songId` int,
	`customSongUrl` text,
	`customSongKey` varchar(500),
	`photoUrl` text,
	`photoKey` varchar(500),
	`paymentStatus` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`paymentId` varchar(100),
	`paymentMethod` enum('stripe','pix'),
	`isActive` boolean NOT NULL DEFAULT false,
	`viewCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`creatorEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cards_id` PRIMARY KEY(`id`),
	CONSTRAINT `cards_publicId_unique` UNIQUE(`publicId`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(200) NOT NULL,
	`method` enum('stripe','pix') NOT NULL,
	`amountCents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`cardCount` int NOT NULL,
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`payerEmail` varchar(320),
	`sessionId` varchar(200),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`artist` varchar(200),
	`duration` int,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500),
	`isPremium` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `songs_id` PRIMARY KEY(`id`)
);
