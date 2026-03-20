"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  Image,
  File,
  Download,
  Trash2,
  Upload,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { UploadForm } from "./upload-form";
import { useDocuments } from "@/hooks/use-documents";
import { formatDateShort } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { IDocument, DocumentCategory, DocumentEntityType } from "@/types";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <Image className="w-5 h-5 text-blue-500" />;
  if (mimeType === "application/pdf") return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-muted-foreground" />;
}

const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  id_copy: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  contract: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  receipt: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  photo: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  other: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function DocumentCard({ doc, onDelete }: { doc: IDocument; onDelete: (id: string) => void }) {
  const t = useTranslations("document");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isImage = doc.mimeType.startsWith("image/");

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/documents/${doc._id}`, { method: "DELETE" });
    setDeleting(false);
    onDelete(doc._id);
  }

  return (
    <>
      <div className="group flex flex-col rounded-lg border bg-card overflow-hidden hover:border-primary/30 transition-colors">
        {/* Thumbnail / icon area */}
        <div className="flex items-center justify-center h-20 bg-muted/40 relative">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.fileUrl}
              alt={doc.fileName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1">
              {fileIcon(doc.mimeType)}
              <span className="text-[10px] text-muted-foreground uppercase">
                {doc.mimeType.split("/")[1]}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5 space-y-1.5">
          <p className="text-xs font-medium truncate" title={doc.fileName}>
            {doc.fileName}
          </p>
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                CATEGORY_COLORS[doc.category]
              )}
            >
              {t(`categories.${doc.category}` as Parameters<typeof t>[0])}
            </span>
            <span className="text-[10px] text-muted-foreground">{formatBytes(doc.fileSize)}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">{formatDateShort(doc.uploadedAt)}</p>
        </div>

        {/* Actions */}
        <div className="flex border-t divide-x">
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={doc.fileName}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Download className="w-3 h-3" />
            {t("download")}
          </a>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            {t("delete")}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title={t("delete")}
        description={t("deleteConfirmDesc")}
        loading={deleting}
      />
    </>
  );
}

interface DocumentListProps {
  entityType: DocumentEntityType;
  entityId: string;
  compact?: boolean;
}

export function DocumentList({ entityType, entityId, compact = false }: DocumentListProps) {
  const t = useTranslations("document");
  const [uploadOpen, setUploadOpen] = useState(false);
  const { documents, isLoading, refresh } = useDocuments({ entityType, entityId });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("title")} {documents.length > 0 && `(${documents.length})`}
        </p>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setUploadOpen(true)}>
          <Upload className="w-3 h-3" />
          {t("addNew")}
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <FolderOpen className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("notFound")}</p>
          <p className="text-xs text-muted-foreground/60">{t("notFoundDesc")}</p>
        </div>
      ) : (
        <div className={cn("grid gap-2", compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}>
          {documents.map((doc) => (
            <DocumentCard key={doc._id} doc={doc} onDelete={() => refresh()} />
          ))}
        </div>
      )}

      <UploadForm
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => refresh()}
        entityType={entityType}
        entityId={entityId}
      />
    </div>
  );
}
