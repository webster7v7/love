CREATE TABLE "visits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"user_agent" text,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_visits_created_at" ON "visits" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_visits_session_id" ON "visits" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_visits_session_unique" ON "visits" USING btree ("session_id");