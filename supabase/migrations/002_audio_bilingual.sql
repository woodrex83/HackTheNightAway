-- Add audio narration and subtitle columns to videos table
alter table videos add column if not exists audio_url text;
alter table videos add column if not exists subtitle_srt text;

-- Add Traditional Chinese title to topics table
alter table topics add column if not exists title_zh text;
