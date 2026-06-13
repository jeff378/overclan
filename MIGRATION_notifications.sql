-- ============================================
-- 오버클랜: 알림 시스템 마이그레이션
-- Supabase SQL 에디터에서 실행하세요
-- ============================================

-- 1. 알림 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,              -- 'clan_request' | 'battle_request' | 'comment' | 'event' | 'clan_accepted' | 'battle_result' 등
  title text NOT NULL,
  message text,
  link text,                       -- 클릭 시 이동할 경로 (예: /clan/123/manage)
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. 조회 성능용 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- 3. RLS 활성화 및 정책
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 본인 알림만 조회
CREATE POLICY "본인 알림 조회" ON notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 누구나 알림 생성 가능 (다른 유저에게 알림을 보내야 하므로)
CREATE POLICY "알림 생성 허용" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 본인 알림만 수정 (읽음 처리)
CREATE POLICY "본인 알림 수정" ON notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- 본인 알림만 삭제
CREATE POLICY "본인 알림 삭제" ON notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 4. 프로필에 알림 설정 컬럼 추가 (기본값: 모두 켜짐)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_clan_request boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_battle_request boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_comment boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_event boolean DEFAULT true;

-- 5. Realtime 구독을 위한 publication 추가 (실시간 알림 뱃지용)
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
