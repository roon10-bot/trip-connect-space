import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  partnerId: string;
}

export const PartnerAvailability = ({ partnerId }: Props) => {
  const queryClient = useQueryClient();
  const [selectedListing, setSelectedListing] = useState<string>("");
  const [open, setOpen] = useState(false);

  const { data: listings } = useQuery({
    queryKey: ["partnerListings", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_listings")
        .select("id, name, status")
        .eq("partner_id", partnerId);
      if (error) throw error;
      return data;
    },
  });

  const listingId = selectedListing || listings?.[0]?.id || "";

  const { data: availability, isLoading } = useQuery({
    queryKey: ["listingAvailability", listingId],
    queryFn: async () => {
      if (!listingId) return [];
      const { data, error } = await supabase
        .from("listing_availability")
        .select("*")
        .eq("listing_id", listingId)
        .order("week_start", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!listingId,
  });

  const addMutation = useMutation({
    mutationFn: async (form: { week_start: string; week_end: string; price_per_week: number; is_blocked: boolean }) => {
      const { error } = await supabase.from("listing_availability").insert({
        listing_id: listingId,
        ...form,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listingAvailability", listingId] });
      setOpen(false);
      toast.success("Vecka tillagd");
    },
    onError: (e: any) => toast.error(e.message || "Kunde inte lägga till vecka"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("listing_availability").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listingAvailability", listingId] });
      toast.success("Vecka borttagen");
    },
  });

  const toggleBlock = useMutation({
    mutationFn: async ({ id, blocked }: { id: string; blocked: boolean }) => {
      const { error } = await supabase.from("listing_availability").update({ is_blocked: blocked }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["listingAvailability", listingId] }),
  });

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addMutation.mutate({
      week_start: fd.get("week_start") as string,
      week_end: fd.get("week_end") as string,
      price_per_week: Number(fd.get("price_per_week")),
      is_blocked: false,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground">Tillgänglighet & Priser</h2>
        <p className="text-muted-foreground">Ange veckopris och blockera datum</p>
      </div>

      {listings && listings.length > 0 && (
        <Select value={listingId} onValueChange={setSelectedListing}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Välj boende" />
          </SelectTrigger>
          <SelectContent>
            {listings.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {listingId && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Lägg till vecka</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Ny vecka</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Veckostart</Label>
                  <Input name="week_start" type="date" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Veckoslut</Label>
                  <Input name="week_end" type="date" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Veckopris (SEK)</Label>
                <Input name="price_per_week" type="number" min={0} required />
              </div>
              <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lägg till"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {availability?.map((a) => (
            <Card key={a.id} className={a.is_blocked ? "opacity-60" : ""}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {format(new Date(a.week_start), "d MMM")} – {format(new Date(a.week_end), "d MMM yyyy")}
                  </span>
                  <span className="text-sm text-muted-foreground">{Number(a.price_per_week).toLocaleString("sv-SE")} SEK / vecka</span>
                  {a.is_blocked && <Badge variant="secondary">Blockerad</Badge>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Blockera</span>
                    <Switch
                      checked={a.is_blocked}
                      onCheckedChange={(checked) => toggleBlock.mutate({ id: a.id, blocked: checked })}
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(a.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {availability?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Inga veckor tillagda ännu</p>
          )}
        </div>
      )}
    </div>
  );
};
