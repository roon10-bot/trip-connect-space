import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileUrl: string;
  fileType?: string | null;
}

const isPreviewableImage = (type?: string | null) =>
  !!type && /^image\/(jpeg|jpg|png|gif|webp|svg)/.test(type);

const isPdf = (type?: string | null) =>
  !!type && type.includes("pdf");

export const DocumentPreviewDialog = ({
  open,
  onOpenChange,
  fileName,
  fileUrl,
  fileType,
}: DocumentPreviewDialogProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  

  useEffect(() => {
    if (!open) {
      setSignedUrl(null);
      return;
    }
    if (fileUrl.startsWith("http")) {
      setSignedUrl(fileUrl);
      return;
    }
    const { data } = supabase.storage
      .from("booking-attachments")
      .getPublicUrl(fileUrl);
    if (data?.publicUrl) {
      setSignedUrl(data.publicUrl);
    } else {
      toast.error("Kunde inte öppna filen");
      onOpenChange(false);
    }
  }, [open, fileUrl]);

  const handleDownload = () => {
    if (!signedUrl) return;
    const a = document.createElement("a");
    a.href = signedUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const canPreview = isPdf(fileType) || isPreviewableImage(fileType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{fileName}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0">
          {loading || !signedUrl ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : isPdf(fileType) ? (
            <iframe
              src={signedUrl}
              className="w-full h-[70vh] rounded-md border border-border"
              title={fileName}
            />
          ) : isPreviewableImage(fileType) ? (
            <div className="flex items-center justify-center h-[70vh]">
              <img
                src={signedUrl}
                alt={fileName}
                className="max-w-full max-h-[70vh] object-contain rounded-md"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <FileText className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground">
                Förhandsgranskning ej tillgänglig för denna filtyp
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-end gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Stäng
          </Button>
          <Button onClick={handleDownload} disabled={!signedUrl}>
            <Download className="w-4 h-4 mr-2" />
            Ladda ner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
