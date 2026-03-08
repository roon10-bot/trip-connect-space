import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Home, Loader2 } from "lucide-react";

interface Props {
  partnerId: string;
  onCreateNew: () => void;
}

export const PartnerListings = ({ partnerId, onCreateNew }: Props) => {
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
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setUploadedImages([]); setMainImageIndex(0); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Lägg till boende</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nytt boende</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic info */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Namn på boendet</Label>
                  <Input id="name" name="name" required placeholder="t.ex. Villa Sunset" />
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
              </div>

              {/* Accommodation details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground border-b pb-2">Boende / Båtinformation</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rooms">Antal rum</Label>
                    <Input id="rooms" name="rooms" type="number" min={0} placeholder="t.ex. 3" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="size_sqm">Storlek (m²)</Label>
                    <Input id="size_sqm" name="size_sqm" type="number" min={0} placeholder="t.ex. 85" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="capacity">Kapacitet (antal gäster)</Label>
                  <Input id="capacity" name="capacity" type="number" min={1} defaultValue={1} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="facilities">Faciliteter</Label>
                  <Input id="facilities" name="facilities" placeholder="t.ex. Pool, WiFi, Balkong, AC (kommaseparerat)" />
                  <p className="text-xs text-muted-foreground">Separera med komma</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="address">Adress</Label>
                  <Input id="address" name="address" placeholder="t.ex. Riva 21000, Split, Kroatien" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Beskrivning av boende</Label>
                  <Textarea id="description" name="description" rows={4} placeholder="Kort beskrivning av boendet eller båten..." />
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-foreground border-b pb-2">Bilder</h3>
                <p className="text-xs text-muted-foreground">
                  Ladda upp bilder som kopplas till boendet (max 5 MB per bild). Klicka på ⭐ för att välja huvudbild.
                </p>

                <div>
                  <label className="cursor-pointer inline-flex">
                    <Button type="button" variant="outline" size="sm" disabled={isUploading} asChild>
                      <span>
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        Välj bilder
                      </span>
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleImageUpload(e.target.files);
                        }
                      }}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  <span className="text-xs text-muted-foreground ml-3 inline-flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> JPG, PNG, WEBP
                  </span>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {uploadedImages.map((url, index) => {
                      const isMain = index === mainImageIndex;
                      return (
                        <div key={url} className={cn(
                          "relative group rounded-lg overflow-hidden border-2",
                          isMain ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                        )}>
                          <img src={url} alt={`Bild ${index + 1}`} className="w-full aspect-square object-cover" />
                          <div className="absolute top-1 left-1 flex gap-1">
                            <span className="bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">{index + 1}</span>
                            {isMain && (
                              <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded font-medium">Huvudbild</span>
                            )}
                          </div>
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant={isMain ? "default" : "secondary"}
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setMainImageIndex(index)}
                              title="Sätt som huvudbild"
                              disabled={isMain}
                            >
                              <Star className={cn("h-3 w-3", isMain && "fill-current")} />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
