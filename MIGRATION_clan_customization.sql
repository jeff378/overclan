-- ============================================
-- 오버클랜: 클랜 프로필 개성 기능 마이그레이션
-- Supabase SQL 에디터에서 실행하세요
-- ============================================

-- 1. clans 테이블에 새 컬럼 추가
ALTER TABLE clans ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#ff6b23';
ALTER TABLE clans ADD COLUMN IF NOT EXISTS vibe_tags text[] DEFAULT '{}';
ALTER TABLE clans ADD COLUMN IF NOT EXISTS banner_image text;
ALTER TABLE clans ADD COLUMN IF NOT EXISTS emblem_image text;

-- 2. Storage 버킷 생성 (클랜 이미지용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('clan-images', 'clan-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS 정책: 로그인한 사용자는 업로드 가능
CREATE POLICY "클랜 이미지 업로드 허용"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'clan-images');

-- 4. Storage RLS 정책: 누구나 조회 가능 (public 버킷)
CREATE POLICY "클랜 이미지 조회 허용"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'clan-images');

-- 5. Storage RLS 정책: 업로드한 사용자는 수정/삭제 가능
CREATE POLICY "클랜 이미지 수정 허용"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'clan-images');

CREATE POLICY "클랜 이미지 삭제 허용"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'clan-images');
