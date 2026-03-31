import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, CheckCircle2, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

export const AdminPartnersList = () => {
  const queryClient = useQueryClient();
  const [selectedPartner, setSelectedPartner] = useState<any>(null);

  const { data: partners, isLoading } = useQuery({
    queryKey: ["adminPartners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, partner }: { id: string; status: string; partner: any }) => {
      const { error } = await supabase
        .from("partner_profiles")
        .update({ status })
        .eq("id", id);
      if (error) throw error;

      // Send approval/rejection email to the host in their preferred language
      const firstName = partner.first_name || partner.contact_person || "";
      const locale = partner.locale || "sv";
      const suffix = locale === "en" ? "_en" : "";
      const templateKey = status === "approved"
        ? `partner_application_approved${suffix}`
        : `partner_application_rejected${suffix}`;
      const actionUrl = status === "approved" ? "https://studentresor.com/auth?mode=login" : undefined;

      supabase.functions.invoke("send-transactional-email", {
        body: {
          template_key: templateKey,
          to_email: partner.email,
          variables: { first_name: firstName },
          ...(actionUrl ? { action_url: actionUrl } : {}),
        },
      }).catch((err) => console.error("Partner status email failed:", err));
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["adminPartners"] });
      toast.success(status === "approved" ? "Värd godkänd — mail skickat" : "Värd nekad — mail skickat");
      setSelectedPartner(null);
    },
    onError: () => toast.error("Kunde inte uppdatera status"),
  });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    const labels: Record<string, string> = {
      pending: "Väntar",
      approved: "Godkänd",
      rejected: "Nekad",
    };
    return <Badge className={colors[status] || ""}>{labels[status] || status}</Badge>;
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const pending = partners?.filter((p) => p.status === "pending") || [];
  const approved = partners?.filter((p) => p.status === "approved") || [];
  const rejected = partners?.filter((p) => p.status === "rejected") || [];

  const renderTable = (list: any[]) => (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Typ</TableHead>
            <TableHead>Namn</TableHead>
            <TableHead>E-post</TableHead>
            <TableHead>Land</TableHead>
            <TableHead>Registrerad</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Åtgärder</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.partner_type === "individual" ? "Privatperson" : "Företag"}</TableCell>
              <TableCell className="font-medium">
                {p.partner_type === "individual"
                  ? `${p.first_name} ${p.last_name}`
                  : p.company_name}
              </TableCell>
              <TableCell>{p.email}</TableCell>
              <TableCell>{p.country}</TableCell>
              <TableCell>{format(new Date(p.created_at), "yyyy-MM-dd")}</TableCell>
              <TableCell>{statusBadge(p.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedPartner(p)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  {p.status === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateStatus.mutate({ id: p.id, status: "approved", partner: p })}
                        disabled={updateStatus.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateStatus.mutate({ id: p.id, status: "rejected", partner: p })}
                        disabled={updateStatus.isPending}
                      >
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
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Inga värdar</TableCell>
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

      <Dialog open={!!selectedPartner} onOpenChange={() => setSelectedPartner(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Värddetaljer</DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4 text-sm">
              <h4 className="font-semibold text-foreground">Grunduppgifter</h4>
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Typ" value={selectedPartner.partner_type === "individual" ? "Privatperson" : "Företag"} />
                {selectedPartner.partner_type === "individual" ? (
                  <>
                    <Detail label="Namn" value={`${selectedPartner.first_name} ${selectedPartner.last_name}`} />
                    <Detail label="Personnummer" value={selectedPartner.personal_id || "—"} />
                  </>
                ) : (
                  <>
                    <Detail label="Företag" value={selectedPartner.company_name} />
                    <Detail label="Org.nr" value={selectedPartner.organization_number} />
                    <Detail label="Kontaktperson" value={selectedPartner.contact_person} />
                  </>
                )}
                <Detail label="E-post" value={selectedPartner.email} />
                <Detail label="Telefon" value={selectedPartner.phone} />
                <Detail label="Adress" value={selectedPartner.address} />
                <Detail label="Stad" value={selectedPartner.city} />
                <Detail label="Land" value={selectedPartner.country} />
              </div>

              <h4 className="font-semibold text-foreground pt-2">Bankuppgifter</h4>
              <div className="grid grid-cols-2 gap-3">
                <Detail label="IBAN" value={selectedPartner.iban} />
                <Detail label="SWIFT/BIC" value={selectedPartner.swift} />
                <Detail label="Bank" value={selectedPartner.bank_name} />
                <Detail label="Bankadress" value={selectedPartner.bank_address} />
                <Detail label="Valuta" value={selectedPartner.currency} />
              </div>

              <h4 className="font-semibold text-foreground pt-2">Intyg</h4>
              <div className="grid grid-cols-1 gap-1">
                <CertDetail label="Intygar uthyrningsrätt" checked={selectedPartner.certifies_rental_rights} />
                <CertDetail label="Intygar lokal skatteredovisning" checked={selectedPartner.certifies_local_taxes} />
                {selectedPartner.partner_type === "company" && (
                  <CertDetail label="Intygar behörighet att företräda företaget" checked={selectedPartner.certifies_company_authority} />
                )}
              </div>
              {selectedPartner.status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => updateStatus.mutate({ id: selectedPartner.id, status: "approved", partner: selectedPartner })}
                    disabled={updateStatus.isPending}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Godkänn
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => updateStatus.mutate({ id: selectedPartner.id, status: "rejected", partner: selectedPartner })}
                    disabled={updateStatus.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Neka
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value: string | null }) => (
  <div>
    <span className="text-muted-foreground">{label}</span>
    <p className="font-medium text-foreground">{value || "—"}</p>
  </div>
);

const CertDetail = ({ label, checked }: { label: string; checked: boolean }) => (
  <div className="flex items-center gap-2">
    {checked ? (
      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
    )}
    <span className="text-foreground">{label}</span>
  </div>
);
