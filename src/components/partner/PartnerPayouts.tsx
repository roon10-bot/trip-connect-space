import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Wallet } from "lucide-react";
import { format } from "date-fns";

interface Props {
  partnerId: string;
}

export const PartnerPayouts = ({ partnerId }: Props) => {
  const { data: payouts, isLoading } = useQuery({
    queryKey: ["partnerPayouts", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_payouts")
        .select("*, partner_listings(name)")
        .eq("partner_id", partnerId)
        .order("payout_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground">Utbetalningar</h2>
        <p className="text-muted-foreground">Historik över utbetalningar till dig</p>
      </div>

      {(!payouts || payouts.length === 0) ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Wallet className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Inga utbetalningar ännu</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Boende</TableHead>
                <TableHead>Belopp</TableHead>
                <TableHead>Referens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell>{format(new Date(p.payout_date), "yyyy-MM-dd")}</TableCell>
                  <TableCell>{p.partner_listings?.name || "—"}</TableCell>
                  <TableCell className="font-medium">{Number(p.amount).toLocaleString("sv-SE")} {p.currency}</TableCell>
                  <TableCell className="text-muted-foreground">{p.reference || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
