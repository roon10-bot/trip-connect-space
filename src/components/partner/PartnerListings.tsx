import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Home, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  partnerId: string;
}

export const PartnerListings = ({ partnerId }: Props) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

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

  const createMutation = useMutation({
    mutationFn: async (form: {
      name: string;
      description: string;
      destination: string;
      country: string;
      address: string;
      capacity: number;
      rooms: number;
      size_sqm: number;
    }) => {
      const { error } = await supabase.from("partner_listings").insert({
        partner_id: partnerId,
        ...form,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partnerListings"] });
      setOpen(false);
      toast.success("Boendet har skapats och väntar på godkännande");
    },
    onError: () => toast.error("Kunde inte skapa boendet"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      name: fd.get("name") as string,
      description: fd.get("description") as string,
      destination: fd.get("destination") as string,
      country: fd.get("country") as string,
      address: fd.get("address") as string,
      capacity: Number(fd.get("capacity")) || 1,
      rooms: Number(fd.get("rooms")) || 0,
      size_sqm: Number(fd.get("size_sqm")) || 0,
    });
  };

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Lägg till boende</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nytt boende</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Namn</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Beskrivning</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="destination">Destination</Label>
                  <Input id="destination" name="destination" required placeholder="t.ex. Split" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="country">Land</Label>
                  <Input id="country" name="country" required placeholder="t.ex. Kroatien" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Adress</Label>
                <Input id="address" name="address" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="capacity">Kapacitet</Label>
                  <Input id="capacity" name="capacity" type="number" min={1} defaultValue={1} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rooms">Rum</Label>
                  <Input id="rooms" name="rooms" type="number" min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="size_sqm">Storlek (m²)</Label>
                  <Input id="size_sqm" name="size_sqm" type="number" min={0} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Skapa boende"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
            <Card key={listing.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{listing.name}</CardTitle>
                  <Badge className={statusColors[listing.status] || ""}>
                    {listing.status === "pending" && "Väntar på godkännande"}
                    {listing.status === "approved" && "Godkänd"}
                    {listing.status === "rejected" && "Nekad"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <span>{listing.destination}, {listing.country}</span>
                  <span>Kapacitet: {listing.capacity}</span>
                  {listing.rooms && <span>{listing.rooms} rum</span>}
                  {listing.size_sqm && <span>{listing.size_sqm} m²</span>}
                </div>
                {listing.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{listing.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
