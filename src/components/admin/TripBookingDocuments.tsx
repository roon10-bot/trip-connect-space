import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Upload, Trash2, Download } from "lucide-react";
import { toast } from "sonner";

export const TripBookingDocuments = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const { data: tripBookings } = useQuery({
    queryKey: ["admin-trip-bookings-for-docs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_bookings")
        .select("id, first_name, last_name, trips(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ["admin-trip-booking-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_booking_documents")
        .select("*, trip_bookings(first_name, last_name, trips(name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase
        .from("trip_booking_documents")
        .delete()
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trip-booking-documents"] });
      toast.success("Dokument borttaget");
    },
    onError: () => toast.error("Kunde inte ta bort dokumentet"),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBookingId || !user?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Filen får inte vara större än 5 MB");
      return;
    }

    setUploading(true);
    try {
      const filePath = `${selectedBookingId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("booking-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("trip_booking_documents")
        .insert({
          trip_booking_id: selectedBookingId,
          file_name: file.name,
          file_url: filePath,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
        });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ["admin-trip-booking-documents"] });
      toast.success("Dokument uppladdad!");
    } catch (err: any) {
      toast.error("Kunde inte ladda upp dokumentet: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Kunddokument</CardTitle>
        <CardDescription>
          Ladda upp flygbiljetter och övriga dokument till kunders bokningar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload section */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-lg border border-dashed border-border">
          <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
            <SelectTrigger className="sm:w-80">
              <SelectValue placeholder="Välj bokning..." />
            </SelectTrigger>
            <SelectContent>
              {tripBookings?.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.first_name} {b.last_name} – {(b.trips as any)?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedBookingId || uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Laddar upp..." : "Ladda upp fil"}
          </Button>
        </div>

        {/* Documents list */}
        {documents && documents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fil</TableHead>
                <TableHead>Kund</TableHead>
                <TableHead>Resa</TableHead>
                <TableHead>Uppladdad</TableHead>
                <TableHead>Åtgärder</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-destructive" />
                      <span className="font-medium">{doc.file_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(doc.trip_bookings as any)?.first_name}{" "}
                    {(doc.trip_bookings as any)?.last_name}
                  </TableCell>
                  <TableCell>
                    {(doc.trip_bookings as any)?.trips?.name}
                  </TableCell>
                  <TableCell>
                    {format(new Date(doc.created_at), "d MMM yyyy", { locale: sv })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={async () => {
                          const { data } = await supabase.storage
                            .from("booking-attachments")
                            .createSignedUrl(doc.file_url, 3600);
                          if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                          else toast.error("Kunde inte öppna filen");
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ta bort dokument?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Är du säker? Dokumentet tas bort permanent.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(doc.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Ta bort
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Inga dokument uppladdade ännu</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
