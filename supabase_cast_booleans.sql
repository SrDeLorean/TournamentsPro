
-- =============================================================================
-- CAST INT TO BOOLEAN (POST MIGRATION)
-- =============================================================================

ALTER TABLE users ALTER COLUMN is_banned DROP DEFAULT;
ALTER TABLE users ALTER COLUMN is_banned TYPE BOOLEAN USING CASE WHEN is_banned = 1 THEN TRUE ELSE FALSE END;
ALTER TABLE users ALTER COLUMN is_banned SET DEFAULT FALSE;

ALTER TABLE teams ALTER COLUMN is_banned DROP DEFAULT;
ALTER TABLE teams ALTER COLUMN is_banned TYPE BOOLEAN USING CASE WHEN is_banned = 1 THEN TRUE ELSE FALSE END;
ALTER TABLE teams ALTER COLUMN is_banned SET DEFAULT FALSE;

ALTER TABLE match_player_stats ALTER COLUMN is_mvp DROP DEFAULT;
ALTER TABLE match_player_stats ALTER COLUMN is_mvp TYPE BOOLEAN USING CASE WHEN is_mvp = 1 THEN TRUE ELSE FALSE END;
ALTER TABLE match_player_stats ALTER COLUMN is_mvp SET DEFAULT FALSE;

ALTER TABLE transfer_applications ALTER COLUMN is_extraordinary DROP DEFAULT;
ALTER TABLE transfer_applications ALTER COLUMN is_extraordinary TYPE BOOLEAN USING CASE WHEN is_extraordinary = 1 THEN TRUE ELSE FALSE END;
ALTER TABLE transfer_applications ALTER COLUMN is_extraordinary SET DEFAULT FALSE;

ALTER TABLE messages ALTER COLUMN is_read DROP DEFAULT;
ALTER TABLE messages ALTER COLUMN is_read TYPE BOOLEAN USING CASE WHEN is_read = 1 THEN TRUE ELSE FALSE END;
ALTER TABLE messages ALTER COLUMN is_read SET DEFAULT FALSE;

ALTER TABLE transfer_offers ALTER COLUMN is_extraordinary DROP DEFAULT;
ALTER TABLE transfer_offers ALTER COLUMN is_extraordinary TYPE BOOLEAN USING CASE WHEN is_extraordinary = 1 THEN TRUE ELSE FALSE END;
ALTER TABLE transfer_offers ALTER COLUMN is_extraordinary SET DEFAULT FALSE;

ALTER TABLE chat_messages ALTER COLUMN is_read DROP DEFAULT;
ALTER TABLE chat_messages ALTER COLUMN is_read TYPE BOOLEAN USING CASE WHEN is_read = 1 THEN TRUE ELSE FALSE END;
ALTER TABLE chat_messages ALTER COLUMN is_read SET DEFAULT FALSE;
