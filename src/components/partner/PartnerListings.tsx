import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Home, Loader2, Pause, Play, Trash2, Pencil } from "lucide-react";
import { EditListingDialog } from "./EditListingDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Props {
  partnerId: string;
  onCreateNew: () => void;
}

export const PartnerListings = ({ partnerId, onCreateNew }: Props) => {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["partnerListings", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_listings")
        .select("*")
        .eq("partner_id", partnerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleToggleStatus = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "pending" : "suspended";
    setActionLoading(listingId);
    try {
      const { error } = await supabase
        .from("partner_listings")
        .update({ status: newStatus })
        .eq("id", listingId);
      if (error) throw error;
      toast.success(newStatus === "suspended" ? "Boendet har avaktiverats" : "Boendet har aktiverats och väntar på godkännande");
      queryClient.invalidateQueries({ queryKey: ["partnerListings", partnerId] });
    } catch {
      toast.error("Något gick fel");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(deleteId);
    try {
      const { error } = await supabase
        .from("partner_listings")
        .delete()
        .eq("id", deleteId);
      if (error) throw error;
      toast.success("Boendet har raderats");
      queryClient.invalidateQueries({ queryKey: ["partnerListings", partnerId] });
    } catch {
      toast.error("Kunde inte radera boendet. Kontrollera att det inte har aktiva bokningar.");
    } finally {
      setDeleteId(null);
      setActionLoading(null);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    suspended: "bg-gray-100 text-gray-800",
  };

  const statusLabels: Record<string, string> = {
    pending: "Väntar på godkännande",
    approved: "Godkänd",
    rejected: "Nekad",
    suspended: "Pausad",
  };

  const canDeactivate = (status: string) => ["approved", "pending"].includes(status);
  const canReactivate = (status: string) => status === "suspended";
  const canDelete = (status: string) => ["pending", "suspended"].includes(status);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground">Mina boenden</h2>
          <p className="text-muted-foreground">Hantera dina boenden och lägg upp nya</p>
        </div>
        <Button onClick={onCreateNew}><Plus className="w-4 h-4 mr-2" /> Lägg till boende</Button>
      </div>

      {(!listings || listings.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Home className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Du har inga boenden ännu. Lägg till ditt första!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {listings.map((listing) => (
            <Card key={listing.id} className={listing.status === "suspended" ? "opacity-70" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {listing.image_url ? (
                      <img src={listing.image_url} alt={listing.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <Home className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <CardTitle className="text-lg">{listing.name}</CardTitle>
                  </div>
                  <Badge className={statusColors[listing.status] || ""}>
                    {statusLabels[listing.status] || listing.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <span>{listing.destination}, {listing.country}</span>
                  <span>Kapacitet: {listing.capacity}</span>
                  {listing.rooms && <span>{listing.rooms} rum</span>}
                  {listing.size_sqm && <span>{listing.size_sqm} m²</span>}
                </div>
                {listing.facilities && listing.facilities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {listing.facilities.map((f, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                )}
                {listing.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{listing.description}</p>
                )}
                {listing.image_urls && listing.image_urls.length > 0 && (
                  <div className="flex gap-1.5 mt-3 overflow-x-auto">
                    {listing.image_urls.slice(0, 5).map((url, i) => (
                      <img key={i} src={url} alt="" className="w-16 h-16 rounded object-cover shrink-0" />
                    ))}
                    {listing.image_urls.length > 5 && (
                      <div className="w-16 h-16 rounded bg-muted flex items-center justify-center shrink-0 text-xs text-muted-foreground">
                        +{listing.image_urls.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                  {canDeactivate(listing.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading === listing.id}
                      onClick={() => handleToggleStatus(listing.id, listing.status)}
                    >
                      {actionLoading === listing.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Pause className="w-4 h-4 mr-1" />
                      )}
                      Avaktivera
                    </Button>
                  )}
                  {canReactivate(listing.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading === listing.id}
                      onClick={() => handleToggleStatus(listing.id, listing.status)}
                    >
                      {actionLoading === listing.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <Play className="w-4 h-4 mr-1" />
                      )}
                      Aktivera igen
                    </Button>
                  )}
                  {canDelete(listing.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      disabled={actionLoading === listing.id}
                      onClick={() => setDeleteId(listing.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Radera
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Radera boende</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill radera detta boende? Denna åtgärd kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Radera
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
