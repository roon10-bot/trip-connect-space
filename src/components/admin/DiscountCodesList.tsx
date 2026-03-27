import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  Ticket, Plus, Trash2, Copy, ToggleLeft, ToggleRight, Wand2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function generateCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export const DiscountCodesList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState<string>("");
  const [discountAmount, setDiscountAmount] = useState<string>("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const resetForm = () => {
    setCode("");
    setDiscountPercent("");
    setDiscountAmount("");
    setMaxUses("");
    setValidFrom("");
    setValidUntil("");
  };

  const { data: codes, isLoading } = useQuery({
    queryKey: ["discount-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!code.trim()) throw new Error("Ange en rabattkod");
      if (!discountPercent && !discountAmount) throw new Error("Ange rabatt i procent eller kronor");
      if (discountPercent && discountAmount) throw new Error("Välj antingen procent eller fast belopp, inte båda");

      const { error } = await supabase.from("discount_codes").insert({
        code: code.trim().toUpperCase(),
        discount_percent: discountPercent ? parseInt(discountPercent) : null,
        discount_amount: discountAmount ? parseFloat(discountAmount) : null,
        max_uses: maxUses ? parseInt(maxUses) : null,
        valid_from: validFrom || null,
        valid_until: validUntil || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-codes"] });
      toast.success("Rabattkod skapad!");
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("discount_codes")
        .update({ is_active: !is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-codes"] });
      toast.success("Status uppdaterad");
    },
    onError: () => toast.error("Kunde inte uppdatera"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("discount_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-codes"] });
      toast.success("Rabattkod raderad");
    },
    onError: () => toast.error("Kunde inte radera"),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-serif">Rabattkoder</CardTitle>
          <CardDescription>Skapa och hantera rabattkoder för dina resor</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Skapa rabattkod</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ny rabattkod</DialogTitle>
              <DialogDescription>Skapa en egen kod eller generera en automatiskt</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Kod</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="T.ex. SOMMAR25"
                    className="uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCode(generateCode())}
                    title="Generera automatiskt"
                  >
                    <Wand2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rabatt i procent (%)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => { setDiscountPercent(e.target.value); if (e.target.value) setDiscountAmount(""); }}
                    placeholder="t.ex. 10"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Rabatt i kronor (SEK)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={discountAmount}
                    onChange={(e) => { setDiscountAmount(e.target.value); if (e.target.value) setDiscountPercent(""); }}
                    placeholder="t.ex. 500"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Max antal användningar</Label>
                <Input
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Lämna tomt för obegränsat"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Giltig från</Label>
                  <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Giltig till</Label>
                  <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="mt-1" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Avbryt</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Skapar..." : "Skapa"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : !codes?.length ? (
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Inga rabattkoder ännu</p>
            <p className="text-sm text-muted-foreground">Klicka på "Skapa rabattkod" för att komma igång</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kod</TableHead>
                  <TableHead>Rabatt</TableHead>
                  <TableHead>Giltighet</TableHead>
                  <TableHead className="text-center">Användningar</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((dc) => (
                  <TableRow key={dc.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-semibold text-sm bg-muted px-2 py-0.5 rounded">{dc.code}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => { navigator.clipboard.writeText(dc.code); toast.success("Kopierad!"); }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {dc.discount_percent
                        ? `${dc.discount_percent}%`
                        : `${Number(dc.discount_amount).toLocaleString("sv-SE")} kr`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dc.valid_from || dc.valid_until ? (
                        <>
                          {dc.valid_from && format(new Date(dc.valid_from), "d MMM yyyy", { locale: sv })}
                          {dc.valid_from && dc.valid_until && " – "}
                          {dc.valid_until && format(new Date(dc.valid_until), "d MMM yyyy", { locale: sv })}
                        </>
                      ) : (
                        "Alltid"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {dc.current_uses}{dc.max_uses ? ` / ${dc.max_uses}` : ""}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={dc.is_active ? "default" : "secondary"}>
                        {dc.is_active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleMutation.mutate({ id: dc.id, is_active: dc.is_active })}
                          title={dc.is_active ? "Inaktivera" : "Aktivera"}
                        >
                          {dc.is_active ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Radera rabattkod?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Koden <strong>{dc.code}</strong> raderas permanent. Vill du fortsätta?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(dc.id)}>Radera</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
