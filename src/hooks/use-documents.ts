"use client";

import useSWR from "swr";
import type { IDocument, DocumentEntityType, DocumentCategory } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UseDocumentsOptions {
  entityType?: DocumentEntityType;
  entityId?: string;
  category?: DocumentCategory | "all";
  page?: number;
  limit?: number;
}

export function useDocuments(options: UseDocumentsOptions = {}) {
  const { entityType, entityId, category, page = 1, limit = 20 } = options;

  const params = new URLSearchParams();
  if (entityType) params.set("entityType", entityType);
  if (entityId) params.set("entityId", entityId);
  if (category && category !== "all") params.set("category", category);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const { data, error, isLoading, mutate } = useSWR(
    `/api/documents?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    documents: (data?.data ?? []) as IDocument[],
    total: (data?.total ?? 0) as number,
    isLoading,
    error,
    refresh: mutate,
  };
}
