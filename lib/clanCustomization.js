import { supabase } from "./supabase";

// 분위기 태그 (성격/색깔)
export const VIBE_TAGS = [
  "빡겜", "즐겜", "친목", "실력향상",
  "심야", "주말", "직장인", "대학생", "성인",
  "마이크필수", "디스코드", "신규환영", "고인물",
  "내전위주", "랭크위주", "꾸준함",
];

// 클랜 대표 색 팔레트
export const ACCENT_COLORS = [
  "#ff6b23", // 오렌지(기본)
  "#e63946", // 레드
  "#f72585", // 핑크
  "#9d4edd", // 퍼플
  "#4361ee", // 블루
  "#4cc9f0", // 시안
  "#06d6a0", // 그린
  "#ffd60a", // 옐로
  "#fb8500", // 앰버
  "#8d99ae", // 그레이
];

// 배경 배너 색 (어두운 톤)
export const BANNER_COLORS = ["#1a1f35", "#1a2535", "#1f1a35", "#1a3525", "#35251a", "#0d1f2d"];

// 이미지 업로드 헬퍼 — clan-images 버킷에 업로드 후 public URL 반환
export async function uploadClanImage(file, clanId, type) {
  if (!file) return { url: null, error: null };

  // 용량 제한 (배너 3MB, 엠블럼 1MB)
  const maxSize = type === "banner" ? 3 * 1024 * 1024 : 1 * 1024 * 1024;
  if (file.size > maxSize) {
    return { url: null, error: `이미지 용량이 너무 커요. (최대 ${type === "banner" ? "3MB" : "1MB"})` };
  }
  if (!file.type.startsWith("image/")) {
    return { url: null, error: "이미지 파일만 업로드할 수 있어요." };
  }

  const ext = file.name.split(".").pop();
  const path = `${clanId}/${type}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("clan-images")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return { url: null, error: "이미지 업로드에 실패했어요. 다시 시도해주세요." };
  }

  const { data } = supabase.storage.from("clan-images").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
