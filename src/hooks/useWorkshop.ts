import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentWorkshopId } from "@/lib/workshop";

export function useWorkshop() {
  return useQuery({
    queryKey: ["workshop"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshops")
        .select("*")
        .eq("id", getCurrentWorkshopId())
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateWorkshop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase
        .from("workshops")
        .update(patch as never)
        .eq("id", getCurrentWorkshopId());
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workshop"] }),
  });
}

const LOGO_BUCKET = "workshop-logos";

function extractLogoPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/${LOGO_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return url.slice(i + marker.length);
}

export function useUploadLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${getCurrentWorkshopId()}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
      const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;

      const { data: current } = await supabase
        .from("workshops")
        .select("logo_url")
        .eq("id", getCurrentWorkshopId())
        .single();
      const oldPath = extractLogoPath(current?.logo_url);

      const { error: updErr } = await supabase
        .from("workshops")
        .update({ logo_url: publicUrl } as never)
        .eq("id", getCurrentWorkshopId());
      if (updErr) throw updErr;

      if (oldPath && oldPath !== path) {
        await supabase.storage.from(LOGO_BUCKET).remove([oldPath]);
      }
      return publicUrl;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workshop"] }),
  });
}

export function useRemoveLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (currentUrl: string | null | undefined) => {
      const path = extractLogoPath(currentUrl);
      const { error } = await supabase
        .from("workshops")
        .update({ logo_url: null } as never)
        .eq("id", getCurrentWorkshopId());
      if (error) throw error;
      if (path) await supabase.storage.from(LOGO_BUCKET).remove([path]);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workshop"] }),
  });
}