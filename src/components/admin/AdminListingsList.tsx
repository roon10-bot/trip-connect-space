import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const AdminListingsList = () => {
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useQuery({
    queryKey: ["adminListings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_listings")
        .select("*, partner_profiles(email, first_name, last_name, company_name, partner_type)")
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
      toast.success(status === "approved" ? "Boende godkänt" : "Boende nekat");
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
            <TableRow key={l.id}>
              <TableCell className="font-medium">{l.name}</TableCell>
              <TableCell>{getOwnerName(l.partner_profiles)}</TableCell>
              <TableCell>{l.destination}, {l.country}</TableCell>
              <TableCell>{l.capacity}</TableCell>
              <TableCell><Badge className={statusColors[l.status] || ""}>{l.status}</Badge></TableCell>
              <TableCell className="text-right">
                {l.status === "pending" && (
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => updateStatus.mutate({ id: l.id, status: "approved" })}>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => updateStatus.mutate({ id: l.id, status: "rejected" })}>
                      <XCircle className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                )}
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
    </div>
  );
};
