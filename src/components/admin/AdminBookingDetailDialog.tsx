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
  History,
  Edit,
  Bell,
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

  // Activity log
  const { data: activityLog } = useQuery({
    queryKey: ["admin-booking-activity", booking.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_activity_log")
        .select("*")
        .eq("trip_booking_id", booking.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Log activity helper
  const logActivity = async (
    activityType: string,
    description: string,
    metadata: Record<string, any> = {}
  ) => {
    try {
      await supabase.from("booking_activity_log").insert({
        trip_booking_id: booking.id,
        activity_type: activityType,
        description,
        metadata,
        created_by: user?.id || null,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-booking-activity", booking.id] });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  };

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
      // Log changes
      const changes: string[] = [];
      if (editData.first_name !== booking.first_name) changes.push(`Förnamn: ${booking.first_name} → ${editData.first_name}`);
      if (editData.last_name !== booking.last_name) changes.push(`Efternamn: ${booking.last_name} → ${editData.last_name}`);
      if (editData.email !== booking.email) changes.push(`E-post: ${booking.email} → ${editData.email}`);
      if (editData.phone !== booking.phone) changes.push(`Telefon: ${booking.phone} → ${editData.phone}`);
      if (editData.departure_location !== booking.departure_location) changes.push(`Avreseort: ${booking.departure_location} → ${editData.departure_location}`);
      if (changes.length > 0) {
        logActivity("detail_change", changes.join(", "), { changes });
      }
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
      await logActivity("document_upload", `Dokument uppladdat: ${file.name}`, { file_name: file.name });
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
      await logActivity("email_sent", `Betalningspåminnelse skickad till ${booking.email}`, { template: "payment_reminder", to: booking.email });
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

        <Tabs defaultValue="details" className="mt-2 flex flex-col">
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="details">Kundinfo</TabsTrigger>
            <TabsTrigger value="travelers">Resenärer</TabsTrigger>
            <TabsTrigger value="payments">Betalning</TabsTrigger>
            <TabsTrigger value="documents">Dokument</TabsTrigger>
            <TabsTrigger value="history">Historik</TabsTrigger>
          </TabsList>

          {/* KUNDINFO */}
          <TabsContent value="details" className="space-y-4 mt-4 min-h-[400px]">
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
          <TabsContent value="travelers" className="mt-4 min-h-[400px]">
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
          <TabsContent value="payments" className="mt-4 space-y-4 min-h-[400px]">
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
          <TabsContent value="documents" className="mt-4 space-y-4 min-h-[400px]">
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

          {/* HISTORIK */}
          <TabsContent value="history" className="mt-4 min-h-[400px]">
            {activityLog && activityLog.length > 0 ? (
              <div className="space-y-3">
                {activityLog.map((log) => {
                  const iconMap: Record<string, React.ReactNode> = {
                    email_sent: <Mail className="w-4 h-4 text-primary" />,
                    email_failed: <Mail className="w-4 h-4 text-destructive" />,
                    payment: <CreditCard className="w-4 h-4 text-primary" />,
                    status_change: <Bell className="w-4 h-4 text-destructive" />,
                    detail_change: <Edit className="w-4 h-4 text-accent-foreground" />,
                    document_upload: <Upload className="w-4 h-4 text-secondary-foreground" />,
                  };
                  const labelMap: Record<string, string> = {
                    email_sent: "E-post",
                    email_failed: "E-post misslyckad",
                    payment: "Betalning",
                    status_change: "Statusändring",
                    detail_change: "Ändring",
                    document_upload: "Dokument",
                  };
                  return (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                      <div className="mt-0.5">
                        {iconMap[log.activity_type] || <History className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {labelMap[log.activity_type] || log.activity_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: sv })}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{log.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-10 h-10 mx-auto mb-2" />
                <p>Ingen historik ännu</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
