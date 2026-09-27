import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { productImage } from "@/lib/waki";

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const STORAGE_PREFIX = "storage:";

export function isStorageImage(key: string | null | undefined): boolean {
  return !!key && key.startsWith(STORAGE_PREFIX);
}

export function storageImagePath(key: string): string {
  return key.slice(STORAGE_PREFIX.length);
}

async function signedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (error) throw error;
  return data.signedUrl;
}

export function useProductImageUrl(key: string | null | undefined): string | null {
  const local = productImage(key);
  const storageKey = isStorageImage(key) ? storageImagePath(key!) : null;
  const { data } = useQuery({
    queryKey: ["product-image", storageKey],
    queryFn: () => signedUrl(storageKey!),
    enabled: !!storageKey,
    staleTime: 1000 * 60 * 60 * 24,
  });
  return local ?? data ?? null;
}

export function ProductImg({
  imageKey,
  alt,
  className,
}: {
  imageKey: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const url = useProductImageUrl(imageKey);
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-secondary text-muted-foreground ${className ?? ""}`}>
        <Package className="size-8" />
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
