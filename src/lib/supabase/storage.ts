"use client";

import { createClient } from "@/lib/supabase/client";

const AVATARS_BUCKET = "avatars";

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteAvatar(userId: string): Promise<void> {
  const supabase = createClient();
  const exts = ["jpg", "jpeg", "png", "webp", "gif"];
  await supabase.storage
    .from(AVATARS_BUCKET)
    .remove(exts.map((e) => `${userId}/avatar.${e}`));
}
