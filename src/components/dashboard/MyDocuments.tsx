import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, File } from "lucide-react";

interface MyDocumentsProps {
  userId: string;
}

export const MyDocuments = ({ userId }: MyDocumentsProps) => {
  const { data: documents } = useQuery({
    queryKey: ["my-documents", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_booking_documents")
        .select("*, trip_bookings(id, trips(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const getFileIcon = (fileType?: string | null) => {
    if (fileType?.includes("pdf")) return <FileText className="w-4 h-4 text-destructive" />;
    return <File className="w-4 h-4 text-ocean" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-ocean" />
            Mina dokument
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!documents || documents.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              Inga dokument ännu
            </p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => {
                const tripName = (doc.trip_bookings as any)?.trips?.name || "Okänd resa";
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-border/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-muted">
                        {getFileIcon(doc.file_type)}
                      </div>
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-muted-foreground">{tripName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(doc.created_at), "d MMM yyyy", { locale: sv })}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.file_url, "_blank")}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Ladda ner
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
