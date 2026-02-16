import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Users,
  FileText,
  Upload,
  Send,
  Download,
  Trash2,
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface AdminBookingDetailDialogProps {
  booking: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payments: any[];
}

export const AdminBookingDetailDialog = ({
  booking,
  open,
  onOpenChange,
  payments,
}: AdminBookingDetailDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);

  // Editable fields
  const [editData, setEditData] = useState({
    first_name: booking.first_name,
    last_name: booking.last_name,
    email: booking.email,
    phone: booking.phone,
    departure_location: booking.departure_location,
  });

  // Reset edit data when booking changes
  const resetEditData = () => {
    setEditData({
      first_name: booking.first_name,
      last_name: booking.last_name,
      email: booking.email,
      phone: booking.phone,
      departure_location: booking.departure_location,
    });
  };

  // Travelers
  const { data: travelers } = useQuery({
    queryKey: ["admin-booking-travelers", booking.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_booking_travelers")
        .select("*")
        .eq("trip_booking_id", booking.id)
        .order("traveler_index");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Documents
  const { data: documents } = useQuery({
    queryKey: ["admin-booking-documents", booking.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_booking_documents")
        .select("*")
        .eq("trip_booking_id", booking.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Update booking details
  const updateBookingMutation = useMutation({
    mutationFn: async (data: typeof editData) => {
      const { error } = await supabase
        .from("trip_bookings")
        .update(data)
        .eq("id", booking.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trip-bookings-with-payments"] });
      toast.success("Kunduppgifter uppdaterade");
    },
    onError: () => toast.error("Kunde inte uppdatera uppgifter"),
  });

  // Delete document
  const deleteDocMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase
        .from("trip_booking_documents")
        .delete()
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-booking-documents", booking.id] });
      toast.success("Dokument borttaget");
    },
    onError: () => toast.error("Kunde inte ta bort dokumentet"),
  });

  // Upload document
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Filen får inte vara större än 5 MB");
      return;
    }

    setUploading(true);
    try {
      const filePath = `${booking.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("booking-attachments")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("trip_booking_documents")
        .insert({
          trip_booking_id: booking.id,
          file_name: file.name,
          file_url: filePath,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
        });
      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ["admin-booking-documents", booking.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-trip-booking-documents"] });
      toast.success("Dokument uppladdat!");
    } catch (err: any) {
      toast.error("Kunde inte ladda upp: " + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Send payment reminder
  const handleSendReminder = async () => {
    setSendingReminder(true);
    try {
      const trip = booking.trips as any;
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          template_key: "payment_reminder",
          to_email: booking.email,
          variables: {
            first_name: booking.first_name,
            trip_name: trip?.name || "",
            total_price: String(booking.total_price),
            departure_date: trip?.departure_date || "",
          },
          action_url: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
      toast.success(`Påminnelse skickad till ${booking.email}`);
    } catch (err: any) {
      toast.error("Kunde inte skicka påminnelse: " + (err.message || "Okänt fel"));
    } finally {
      setSendingReminder(false);
    }
  };

  const bookingPayments = payments.filter(
    (p) => p.trip_booking_id === booking.id && p.status === "completed"
  );
  const paidAmount = bookingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPrice = Number(booking.total_price);
  const percentage = totalPrice > 0 ? Math.round((paidAmount / totalPrice) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (v) resetEditData(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <User className="w-5 h-5" />
            {booking.first_name} {booking.last_name} – {booking.trips?.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-2">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="details">Kundinfo</TabsTrigger>
            <TabsTrigger value="travelers">Resenärer</TabsTrigger>
            <TabsTrigger value="payments">Betalning</TabsTrigger>
            <TabsTrigger value="documents">Dokument</TabsTrigger>
          </TabsList>

          {/* KUNDINFO */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Förnamn</Label>
                <Input
                  value={editData.first_name}
                  onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Efternamn</Label>
                <Input
                  value={editData.last_name}
                  onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Mail className="w-3 h-3" /> E-post</Label>
                <Input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> Telefon</Label>
                <Input
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Avreseort</Label>
                <Input
                  value={editData.departure_location}
                  onChange={(e) => setEditData({ ...editData, departure_location: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={() => updateBookingMutation.mutate(editData)}
                disabled={updateBookingMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateBookingMutation.isPending ? "Sparar..." : "Spara ändringar"}
              </Button>
              <Button
                variant="outline"
                onClick={handleSendReminder}
                disabled={sendingReminder}
              >
                {sendingReminder ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Skicka betalningspåminnelse
              </Button>
            </div>

            <div className="rounded-lg border p-3 bg-muted/30 text-sm space-y-1">
              <p><span className="text-muted-foreground">Bokningsnummer:</span> <span className="font-mono">{booking.id.slice(0, 8).toUpperCase()}</span></p>
              <p><span className="text-muted-foreground">Bokad:</span> {format(new Date(booking.created_at), "d MMM yyyy HH:mm", { locale: sv })}</p>
              <p><span className="text-muted-foreground">Antal resenärer:</span> {booking.travelers} st</p>
              {booking.discount_code && (
                <p><span className="text-muted-foreground">Rabattkod:</span> {booking.discount_code} (−{Number(booking.discount_amount).toLocaleString("sv-SE")} kr)</p>
              )}
            </div>
          </TabsContent>

          {/* RESENÄRER */}
          <TabsContent value="travelers" className="mt-4">
            {travelers && travelers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Namn</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Född</TableHead>
                    <TableHead>Avreseort</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {travelers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.traveler_index + 1}</TableCell>
                      <TableCell className="font-medium">{t.first_name} {t.last_name}</TableCell>
                      <TableCell className="text-sm">{t.email}</TableCell>
                      <TableCell className="text-sm">{t.phone}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(t.birth_date), "yyyy-MM-dd")}
                      </TableCell>
                      <TableCell className="text-sm">{t.departure_location}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2" />
                <p>Inga medresenärer registrerade</p>
              </div>
            )}
          </TabsContent>

          {/* BETALNING */}
          <TabsContent value="payments" className="mt-4 space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Totalpris</span>
                <span className="font-semibold">{totalPrice.toLocaleString("sv-SE")} kr</span>
              </div>
              <Progress value={percentage} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Betalt: {paidAmount.toLocaleString("sv-SE")} kr</span>
                <span>Kvar: {(totalPrice - paidAmount).toLocaleString("sv-SE")} kr</span>
              </div>
            </div>

            {bookingPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Typ</TableHead>
                    <TableHead>Belopp</TableHead>
                    <TableHead>Betald</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="capitalize">{p.payment_type}</TableCell>
                      <TableCell>{Number(p.amount).toLocaleString("sv-SE")} kr</TableCell>
                      <TableCell>
                        {p.paid_at
                          ? format(new Date(p.paid_at), "d MMM yyyy", { locale: sv })
                          : "–"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CreditCard className="w-10 h-10 mx-auto mb-2" />
                <p>Inga betalningar registrerade</p>
              </div>
            )}
          </TabsContent>

          {/* DOKUMENT */}
          <TabsContent value="documents" className="mt-4 space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border border-dashed border-border">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Laddar upp..." : "Ladda upp dokument"}
              </Button>
              <span className="text-sm text-muted-foreground">Max 5 MB</span>
            </div>

            {documents && documents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fil</TableHead>
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
                      <TableCell className="text-sm">
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
                                  Dokumentet tas bort permanent.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteDocMutation.mutate(doc.id)}
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
              <div className="text-center py-6 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2" />
                <p>Inga dokument uppladdade</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
