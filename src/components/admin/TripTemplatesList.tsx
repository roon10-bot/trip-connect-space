import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Pencil, Trash2, Copy, FileText, Loader2 } from "lucide-react";

const TRIP_TYPE_LABELS: Record<string, string> = {
  seglingsvecka: "Seglingsveckan",
  splitveckan: "Splitveckan",
  studentveckan: "Studentveckan",
};

interface TripTemplate {
  id: string;
  template_name: string;
  trip_type: string;
  name: string | null;
  capacity: number | null;
  min_persons: number | null;
  max_persons: number | null;
  base_price: number | null;
  base_price_accommodation: number | null;
  base_price_flight: number | null;
  base_price_extras: number | null;
  price: number | null;
  departure_location: string | null;
  description: string | null;
  accommodation_rooms: number | null;
  accommodation_size_sqm: number | null;
  accommodation_facilities: string[] | null;
  accommodation_address: string | null;
  accommodation_description: string | null;
  first_payment_amount: number | null;
  first_payment_type: string | null;
  second_payment_amount: number | null;
  second_payment_type: string | null;
  final_payment_amount: number | null;
  final_payment_type: string | null;
  created_at: string;
  updated_at: string;
}

// Define which fields are available per section
const FIELD_SECTIONS = [
  {
    label: "Grundinformation",
    fields: [
      { key: "name", label: "Namn på resa", type: "text" },
      { key: "capacity", label: "Kapacitet / Antal båtar", type: "number" },
      { key: "min_persons", label: "Min antal personer", type: "number" },
      { key: "max_persons", label: "Max antal personer", type: "number" },
      { key: "departure_location", label: "Avgångsort", type: "text" },
      { key: "description", label: "Beskrivning", type: "textarea" },
    ],
  },
  {
    label: "Prissättning",
    fields: [
      { key: "price", label: "Pris (kr)", type: "number" },
      { key: "base_price", label: "Baspris", type: "number" },
      { key: "base_price_accommodation", label: "Baspris boende", type: "number" },
      { key: "base_price_flight", label: "Baspris flyg", type: "number" },
      { key: "base_price_extras", label: "Baspris extras", type: "number" },
    ],
  },
  {
    label: "Boende",
    fields: [
      { key: "accommodation_rooms", label: "Antal rum/kabiner", type: "number" },
      { key: "accommodation_size_sqm", label: "Storlek (m²)", type: "number" },
      { key: "accommodation_address", label: "Adress", type: "text" },
      { key: "accommodation_description", label: "Beskrivning av boende", type: "textarea" },
      { key: "accommodation_facilities", label: "Faciliteter (kommaseparerat)", type: "text" },
    ],
  },
  {
    label: "Betalningsplan",
    fields: [
      { key: "first_payment_amount", label: "Första betalning", type: "number" },
      { key: "first_payment_type", label: "Typ (percent/amount)", type: "select_payment" },
      { key: "second_payment_amount", label: "Andra betalning", type: "number" },
      { key: "second_payment_type", label: "Typ (percent/amount)", type: "select_payment" },
      { key: "final_payment_amount", label: "Slutbetalning", type: "number" },
      { key: "final_payment_type", label: "Typ (percent/amount)", type: "select_payment" },
    ],
  },
];

const defaultFormData = (): Record<string, string> => {
  const data: Record<string, string> = {
    template_name: "",
    trip_type: "splitveckan",
  };
  FIELD_SECTIONS.forEach((s) =>
    s.fields.forEach((f) => {
      data[f.key] = "";
    })
  );
  return data;
};

const defaultEnabledFields = (): Record<string, boolean> => {
  const map: Record<string, boolean> = {};
  FIELD_SECTIONS.forEach((s) => s.fields.forEach((f) => (map[f.key] = false)));
  return map;
};

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template?: TripTemplate | null;
  onSave: (data: Record<string, unknown>) => void;
  saving: boolean;
}

const TemplateFormDialog = ({ open, onOpenChange, template, onSave, saving }: TemplateFormDialogProps) => {
  const [formData, setFormData] = useState<Record<string, string>>(defaultFormData());
  const [enabledFields, setEnabledFields] = useState<Record<string, boolean>>(defaultEnabledFields());

  // Reset form when dialog opens
  useState(() => {
    if (template) {
      const data: Record<string, string> = {
        template_name: template.template_name,
        trip_type: template.trip_type,
      };
      const enabled: Record<string, boolean> = {};
      FIELD_SECTIONS.forEach((s) =>
        s.fields.forEach((f) => {
          const val = (template as any)[f.key];
          if (f.key === "accommodation_facilities" && Array.isArray(val)) {
            data[f.key] = val.join(", ");
            enabled[f.key] = true;
          } else if (val !== null && val !== undefined && val !== "" && val !== 0) {
            data[f.key] = String(val);
            enabled[f.key] = true;
          } else {
            data[f.key] = val !== null && val !== undefined ? String(val) : "";
            enabled[f.key] = false;
          }
        })
      );
      setFormData(data);
      setEnabledFields(enabled);
    } else {
      setFormData(defaultFormData());
      setEnabledFields(defaultEnabledFields());
    }
  });

  const handleSubmit = () => {
    if (!formData.template_name.trim()) {
      toast.error("Mallnamn krävs");
      return;
    }
    const result: Record<string, unknown> = {
      template_name: formData.template_name.trim(),
      trip_type: formData.trip_type,
    };
    FIELD_SECTIONS.forEach((s) =>
      s.fields.forEach((f) => {
        if (enabledFields[f.key] && formData[f.key]) {
          if (f.key === "accommodation_facilities") {
            result[f.key] = formData[f.key].split(",").map((x: string) => x.trim()).filter(Boolean);
          } else if (f.type === "number") {
            result[f.key] = Number(formData[f.key]);
          } else {
            result[f.key] = formData[f.key];
          }
        } else {
          result[f.key] = null;
        }
      })
    );
    onSave(result);
  };

  const renderField = (field: { key: string; label: string; type: string }) => {
    if (field.type === "textarea") {
      return (
        <Textarea
          value={formData[field.key] || ""}
          onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
          disabled={!enabledFields[field.key]}
          className="min-h-[60px]"
        />
      );
    }
    if (field.type === "select_payment") {
      return (
        <Select
          value={formData[field.key] || "amount"}
          onValueChange={(v) => setFormData((p) => ({ ...p, [field.key]: v }))}
          disabled={!enabledFields[field.key]}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="amount">Belopp (kr)</SelectItem>
            <SelectItem value="percent">Procent (%)</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input
        type={field.type === "number" ? "number" : "text"}
        value={formData[field.key] || ""}
        onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
        disabled={!enabledFields[field.key]}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {template ? "Redigera resmall" : "Skapa resmall"}
          </DialogTitle>
          <DialogDescription>
            Välj vilka fält som ska ingå i mallen. Bara aktiverade fält sparas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Required fields */}
          <div className="space-y-3">
            <div>
              <Label className="font-semibold">Mallnamn *</Label>
              <Input
                value={formData.template_name}
                onChange={(e) => setFormData((p) => ({ ...p, template_name: e.target.value }))}
                placeholder="t.ex. Splitveckan Inez Standard"
              />
            </div>
            <div>
              <Label className="font-semibold">Restyp *</Label>
              <Select
                value={formData.trip_type}
                onValueChange={(v) => setFormData((p) => ({ ...p, trip_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seglingsvecka">Seglingsveckan</SelectItem>
                  <SelectItem value="splitveckan">Splitveckan</SelectItem>
                  <SelectItem value="studentveckan">Studentveckan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Configurable fields by section */}
          {FIELD_SECTIONS.map((section) => (
            <div key={section.label} className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {section.label}
              </h3>
              <div className="space-y-3">
                {section.fields.map((field) => (
                  <div key={field.key} className="flex items-start gap-3">
                    <Checkbox
                      checked={enabledFields[field.key]}
                      onCheckedChange={(c) =>
                        setEnabledFields((p) => ({ ...p, [field.key]: !!c }))
                      }
                      className="mt-2"
                    />
                    <div className="flex-1 space-y-1">
                      <Label className={enabledFields[field.key] ? "" : "text-muted-foreground"}>
                        {field.label}
                      </Label>
                      {renderField(field)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Sparar..." : template ? "Uppdatera" : "Skapa mall"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const TripTemplatesList = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editTemplate, setEditTemplate] = useState<TripTemplate | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["trip-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_templates" as any)
        .select("*")
        .order("trip_type")
        .order("template_name");
      if (error) throw error;
      return data as unknown as TripTemplate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: Record<string, unknown>) => {
      const { error } = await supabase
        .from("trip_templates" as any)
        .insert({ ...values, created_by: user?.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-templates"] });
      toast.success("Mall skapad!");
      setShowCreate(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("trip_templates" as any)
        .update(values as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-templates"] });
      toast.success("Mall uppdaterad!");
      setEditTemplate(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("trip_templates" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-templates"] });
      toast.success("Mall borttagen!");
      setDeleteId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const grouped = (templates || []).reduce<Record<string, TripTemplate[]>>((acc, t) => {
    (acc[t.trip_type] = acc[t.trip_type] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Resmallar</h2>
          <p className="text-muted-foreground">Skapa och hantera mallar för att snabbt skapa nya resor.</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Skapa mall
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !templates?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Inga mallar skapade ännu.</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Skapa din första mall
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <div key={type} className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Badge variant="secondary">{TRIP_TYPE_LABELS[type] || type}</Badge>
              <span className="text-sm text-muted-foreground font-normal">
                {items.length} {items.length === 1 ? "mall" : "mallar"}
              </span>
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => (
                <Card key={t.id} className="group hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{t.template_name}</CardTitle>
                        {t.name && (
                          <CardDescription className="mt-1">{t.name}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {t.price != null && <Badge variant="outline">{Number(t.price).toLocaleString("sv-SE")} kr</Badge>}
                      {t.capacity != null && <Badge variant="outline">Kap: {t.capacity}</Badge>}
                      {t.departure_location && <Badge variant="outline">{t.departure_location}</Badge>}
                      {t.accommodation_address && <Badge variant="outline">{t.accommodation_address}</Badge>}
                      {t.max_persons != null && <Badge variant="outline">Max: {t.max_persons} pers</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditTemplate(t)}>
                        <Pencil className="w-3 h-3 mr-1" />
                        Redigera
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(t.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Ta bort
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Create dialog */}
      <TemplateFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSave={(data) => createMutation.mutate(data)}
        saving={createMutation.isPending}
      />

      {/* Edit dialog */}
      {editTemplate && (
        <TemplateFormDialog
          open={!!editTemplate}
          onOpenChange={(v) => !v && setEditTemplate(null)}
          template={editTemplate}
          onSave={(data) => updateMutation.mutate({ id: editTemplate.id, values: data })}
          saving={updateMutation.isPending}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort mall?</AlertDialogTitle>
            <AlertDialogDescription>
              Mallen tas bort permanent. Detta påverkar inte redan skapade resor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
