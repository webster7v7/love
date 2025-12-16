ALTER TABLE "custom_quotes" ADD CONSTRAINT "custom_quotes_text_length_check" CHECK (length("custom_quotes"."text") > 0 AND length("custom_quotes"."text") <= 200);--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_content_length_check" CHECK (length("messages"."content") > 0 AND length("messages"."content") <= 200);--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_color_format_check" CHECK ("messages"."color" ~ '^#[0-9A-Fa-f]{6}$');--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_url_not_empty_check" CHECK (length("photos"."url") > 0);--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_caption_length_check" CHECK (length("photos"."caption") <= 50);