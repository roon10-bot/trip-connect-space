import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle, Eye, Home, MapPin, Users, Ruler, DoorOpen } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const AdminListingsList = () => {
  const queryClient = useQueryClient();
  const [selectedListing, setSelectedListing] = useState<any>(null);

  const { data: listings, isLoading } = useQuery({
    queryKey: ["adminListings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_listings")
        .select("*, partner_profiles(email, first_name, last_name, company_name, partner_type, phone, country)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("partner_listings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["adminListings"] });
      setSelectedListing(null);
      toast.success(status === "approved" ? "Boende godkänt – reseutkast skapas automatiskt" : "Boende nekat");
    },
    onError: () => toast.error("Kunde inte uppdatera status"),
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const pending = listings?.filter((l) => l.status === "pending") || [];
  const approved = listings?.filter((l) => l.status === "approved") || [];
  const rejected = listings?.filter((l) => l.status === "rejected") || [];

  const getOwnerName = (p: any) => {
    if (!p) return "—";
    return p.partner_type === "individual" ? `${p.first_name} ${p.last_name}` : p.company_name;
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  const statusLabels: Record<string, string> = {
    pending: "Väntar",
    approved: "Godkänd",
    rejected: "Nekad",
  };

  const renderTable = (list: any[]) => (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Boende</TableHead>
            <TableHead>Värd</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Kapacitet</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Åtgärder</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((l) => (
            <TableRow key={l.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedListing(l)}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {l.image_url ? (
                    <img src={l.image_url} alt={l.name} className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <Home className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="font-medium">{l.name}</span>
                </div>
              </TableCell>
              <TableCell>{getOwnerName(l.partner_profiles)}</TableCell>
              <TableCell>{l.destination}, {l.country}</TableCell>
              <TableCell>{l.capacity}</TableCell>
              <TableCell><Badge className={statusColors[l.status] || ""}>{statusLabels[l.status] || l.status}</Badge></TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedListing(l); }}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {l.status === "pending" && (
                    <>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: l.id, status: "approved" }); }}>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: l.id, status: "rejected" }); }}>
                        <XCircle className="w-4 h-4 text-red-600" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {list.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Inga boenden</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Väntande ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Godkända ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Nekade ({rejected.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">{renderTable(pending)}</TabsContent>
        <TabsContent value="approved">{renderTable(approved)}</TabsContent>
        <TabsContent value="rejected">{renderTable(rejected)}</TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedListing} onOpenChange={(v) => { if (!v) setSelectedListing(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedListing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedListing.name}
                  <Badge className={statusColors[selectedListing.status] || ""}>{statusLabels[selectedListing.status] || selectedListing.status}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Images */}
                {selectedListing.image_urls && selectedListing.image_urls.length > 0 && (
                  <div className="space-y-2">
                    <img
                      src={selectedListing.image_url || selectedListing.image_urls[0]}
                      alt={selectedListing.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    {selectedListing.image_urls.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto">
                        {selectedListing.image_urls.map((url: string, i: number) => (
                          <img key={i} src={url} alt="" className="w-20 h-20 rounded object-cover shrink-0" />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedListing.destination}, {selectedListing.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{selectedListing.capacity} gäster</span>
                  </div>
                  {selectedListing.rooms && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DoorOpen className="w-4 h-4" />
                      <span>{selectedListing.rooms} rum</span>
                    </div>
                  )}
                  {selectedListing.size_sqm && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Ruler className="w-4 h-4" />
                      <span>{selectedListing.size_sqm} m²</span>
                    </div>
                  )}
                </div>

                {selectedListing.address && (
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Adress</p>
                    <p className="text-muted-foreground">{selectedListing.address}</p>
                  </div>
                )}

                {selectedListing.description && (
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Beskrivning</p>
                    <p className="text-muted-foreground whitespace-pre-line">{selectedListing.description}</p>
                  </div>
                )}

                {selectedListing.facilities && selectedListing.facilities.length > 0 && (
                  <div>
                    <p className="font-medium text-foreground text-sm mb-2">Faciliteter</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedListing.facilities.map((f: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Host info */}
                {selectedListing.partner_profiles && (
                  <div className="border-t pt-4">
                    <p className="font-medium text-foreground text-sm mb-2">Värdinformation</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <span>Namn: {getOwnerName(selectedListing.partner_profiles)}</span>
                      <span>E-post: {selectedListing.partner_profiles.email}</span>
                      {selectedListing.partner_profiles.phone && <span>Telefon: {selectedListing.partner_profiles.phone}</span>}
                      {selectedListing.partner_profiles.country && <span>Land: {selectedListing.partner_profiles.country}</span>}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedListing.status === "pending" && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      className="flex-1"
                      onClick={() => updateStatus.mutate({ id: selectedListing.id, status: "approved" })}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Godkänn boende
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => updateStatus.mutate({ id: selectedListing.id, status: "rejected" })}
                      disabled={updateStatus.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Neka boende
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};