"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FolderOpen, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentList } from "@/components/documents/document-list";
import { useDocuments } from "@/hooks/use-documents";
import { Skeleton } from "@/components/ui/skeleton";
import type { DocumentEntityType, DocumentCategory } from "@/types";

const ENTITY_TYPES: DocumentEntityType[] = ["client", "vehicle", "contract"];
const CATEGORIES: DocumentCategory[] = ["id_copy", "contract", "receipt", "photo", "other"];

function GlobalDocumentGrid() {
  const t = useTranslations("document");
  const [entityType, setEntityType] = useState<DocumentEntityType | "all">("all");
  const [category, setCategory] = useState<DocumentCategory | "all">("all");

  const { documents, total, isLoading } = useDocuments({
    entityType: entityType !== "all" ? entityType : undefined,
    category: category !== "all" ? category : undefined,
    limit: 50,
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={entityType} onValueChange={(v) => setEntityType(v as DocumentEntityType | "all")}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <Filter className="w-3 h-3 me-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("entityTypes.all")}</SelectItem>
            {ENTITY_TYPES.map((et) => (
              <SelectItem key={et} value={et}>
                {t(`entityTypes.${et}` as Parameters<typeof t>[0])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory | "all")}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("categories.all")}</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {t(`categories.${c}` as Parameters<typeof t>[0])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {total > 0 && (
          <span className="flex items-center text-xs text-muted-foreground ms-auto">
            {t("subtitle", { count: total })}
          </span>
        )}
      </div>

      {/* Document grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-lg" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted">
            <FolderOpen className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="text-base font-semibold">{t("notFound")}</p>
          <p className="text-sm text-muted-foreground max-w-xs">{t("notFoundDesc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {documents.map((doc) => (
            <div key={doc._id} className="group flex flex-col rounded-lg border bg-card overflow-hidden hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-center h-24 bg-muted/40">
                {doc.mimeType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={doc.fileUrl} alt={doc.fileName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl">
                    {doc.mimeType === "application/pdf" ? "📄" : "📁"}
                  </span>
                )}
              </div>
              <div className="p-2 space-y-1">
                <p className="text-xs font-medium truncate" title={doc.fileName}>{doc.fileName}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground capitalize">{doc.entityType}</span>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline"
                  >
                    {t("download")}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  const t = useTranslations("document");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
          <FolderOpen className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("pageDesc")}</p>
        </div>
      </div>

      <GlobalDocumentGrid />
    </div>
  );
}
