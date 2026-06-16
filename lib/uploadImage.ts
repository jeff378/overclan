import { supabase } from "./supabase";

// 게시판 글 이미지 업로드 (post-images 버킷). 클랜 이미지(uploadClanImage)와 동일 패턴.
export async function uploadPostImage(file: File, userId: string): Promise<{ url: string | null; error: string | null }> {
  if (!file) return { url: null, error: null };
  if (file.size > 5 * 1024 * 1024) return { url: null, error: "이미지 용량이 너무 커요. (최대 5MB)" };
  if (!file.type.startsWith("image/")) return { url: null, error: "이미지 파일만 업로드할 수 있어요." };

  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("post-images").upload(path, file, { upsert: true });
  if (error) return { url: null, error: "이미지 업로드에 실패했어요. (스토리지 설정을 확인해주세요)" };

  const { data } = supabase.storage.from("post-images").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}
