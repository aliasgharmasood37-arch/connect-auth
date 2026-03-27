-- ── Migration: add captured_data, source, status to leads ──────────────────
-- Safe to run multiple times (all changes use IF NOT EXISTS / DO blocks).

-- 1. captured_data — flexible JSONB blob for dynamic lead fields
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS captured_data JSONB DEFAULT '{}'::jsonb;

-- 2. source — where the lead came from ('dm' | 'comment')
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'dm';

-- 3. status — lead pipeline status
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';

-- 4. Index on workspace_id (safe to create if already exists via IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_leads_workspace_id ON leads(workspace_id);

-- 5. Index on status for future filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
