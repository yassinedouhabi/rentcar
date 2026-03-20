"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload, X, FileText, Image } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { DocumentCategory, DocumentEntityType } from "@/types";

const CATEGORIES: DocumentCategory[] = ["id_copy", "contract", "receipt", "photo", "other"];
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

interface UploadFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entityType: DocumentEntityType;
  entityId: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadForm({ open, onClose, onSuccess, entityType, entityId }: UploadFormProps) {
  const t = useTranslations("document");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function reset() {
    setFile(null);
    setCategory("other");
    setProgress(0);
    setUploading(false);
    setError(null);
  }

  function handleClose() {
    if (uploading) return;
    reset();
    onClose();
  }

  function validateFile(f: File): string | null {
    if (f.size > MAX_SIZE) return t("errorSize");
    if (!ALLOWED_TYPES.includes(f.type)) return t("errorType");
    return null;
  }

  function selectFile(f: File) {
    const err = validateFile(f);
    if (err) { setError(err); return; }
    setError(null);
    setFile(f);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) selectFile(f);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  }

  async function upload() {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", entityType);
    formData.append("entityId", entityId);
    formData.append("category", category);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setUploading(false);
      if (xhr.status === 201) {
        reset();
        onSuccess();
        onClose();
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          setError(res.error ?? t("errorUpload"));
        } catch {
          setError(t("errorUpload"));
        }
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setError(t("errorUpload"));
    };
    xhr.open("POST", "/api/documents");
    xhr.send(formData);
  }

  const fileIcon = file?.type.startsWith("image/") ? (
    <Image className="w-8 h-8 text-blue-500" />
  ) : (
    <FileText className="w-8 h-8 text-red-500" />
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("upload")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Drop zone */}
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors",
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium">{t("dragDrop")}</p>
              <p className="text-xs text-muted-foreground">{t("orBrowse")}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{t("maxSize")}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              {fileIcon}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              {!uploading && (
                <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="hidden"
            onChange={onInputChange}
          />

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("category")}</label>
            <Select value={category} onValueChange={(v) => setCategory(v as DocumentCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`categories.${c}` as Parameters<typeof t>[0])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("uploading")}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={handleClose} disabled={uploading}>
              {t("cancel")}
            </Button>
            <Button onClick={upload} disabled={!file || uploading}>
              {uploading ? t("uploading") : t("upload")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
