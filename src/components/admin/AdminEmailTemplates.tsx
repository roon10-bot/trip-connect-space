import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Eye, Mail, ArrowLeft, Info } from "lucide-react";
import DOMPurify from "dompurify";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  heading: string;
  body_text: string;
  button_text: string;
  footer_text: string;
  primary_color: string;
  logo_url: string | null;
  updated_at: string;
}

const PLACEHOLDER_INFO: Record<string, string[]> = {
  invite_traveler: [
    "{{first_name}} – Resenärens förnamn",
    "{{trip_name}} – Resans namn",
    "{{trip_type}} – Restyp",
    "{{departure_date}} – Avresedatum",
    "{{return_date}} – Hemresedatum",
    "{{site_url}} – Webbplatsens URL",
  ],
  welcome: [
    "{{first_name}} – Användarens förnamn",
  ],
  booking_confirmation: [
    "{{first_name}} – Bokningsansvarigs förnamn",
    "{{trip_name}} – Resans namn",
    "{{departure_date}} – Avresedatum",
    "{{return_date}} – Hemresedatum",
    "{{travelers}} – Antal resenärer",
    "{{total_price}} – Totalpris i SEK",
  ],
  booking_cancelled: [
    "{{first_name}} – Bokningsansvarigs förnamn",
    "{{trip_name}} – Resans namn",
    "{{departure_date}} – Avresedatum",
    "{{return_date}} – Hemresedatum",
  ],
  payment_confirmation: [
    "{{first_name}} – Bokningsansvarigs förnamn",
    "{{trip_name}} – Resans namn",
    "{{amount}} – Betalt belopp i SEK",
    "{{departure_date}} – Avresedatum",
    "{{return_date}} – Hemresedatum",
  ],
  meeting_confirmation: [
    "{{first_name}} – Besökarens förnamn",
    "{{date}} – Mötesdatum",
    "{{time}} – Mötestid",
    "{{school}} – Skolnamn",
  ],
  contact_confirmation: [
    "{{first_name}} – Avsändarens förnamn",
    "{{subject}} – Ämne",
  ],
};

export const AdminEmailTemplates = () => {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [editForm, setEditForm] = useState<Partial<EmailTemplate>>({});
  const [showPreview, setShowPreview] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["email-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (template: Partial<EmailTemplate> & { id: string }) => {
      const { error } = await supabase
        .from("email_templates")
        .update({
          subject: template.subject,
          heading: template.heading,
          body_text: template.body_text,
          button_text: template.button_text,
          footer_text: template.footer_text,
          primary_color: template.primary_color,
          logo_url: template.logo_url,
        })
        .eq("id", template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("E-postmallen har sparats!");
    },
    onError: () => {
      toast.error("Kunde inte spara mallen");
    },
  });

  const handleSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({ ...template });
    setShowPreview(false);
  };

  const handleSave = () => {
    if (!editForm.id) return;
    updateMutation.mutate(editForm as Partial<EmailTemplate> & { id: string });
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setEditForm({});
    setShowPreview(false);
  };

  const buildPreviewHtml = () => {
    const color = editForm.primary_color || "#38bdf8";
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        ${editForm.logo_url ? `<img src="${editForm.logo_url}" alt="Logo" style="max-height: 48px; margin-bottom: 16px;" />` : ""}
        <h1 style="color: ${color};">${editForm.heading || ""}</h1>
        <p>${(editForm.body_text || "").replace(/\\n/g, "\n").replace(/\n/g, "<br/>")}</p>
        ${editForm.button_text ? `
          <p style="text-align: center; margin: 30px 0;">
            <a href="#" style="background: ${color}; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">
              ${editForm.button_text}
            </a>
          </p>
        ` : ""}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
        <p style="color: #666; font-size: 14px;">${(editForm.footer_text || "").replace(/\\n/g, "\n").replace(/\n/g, "<br/>")}</p>
      </div>
    `;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Template list view
  if (!selectedTemplate) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Välj en mall nedan för att redigera textinnehåll, knapptext och färger. Viktiga länkar (t.ex. aktiveringslänkar) hanteras automatiskt och kan inte tas bort.
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => handleSelect(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base font-semibold">
                    {template.name}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {template.subject}
                </p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: template.primary_color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    Uppdaterad {new Date(template.updated_at).toLocaleDateString("sv-SE")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Template edit view
  const placeholders = PLACEHOLDER_INFO[selectedTemplate.template_key] || [];

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={handleBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Tillbaka till mallar
      </Button>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold">{selectedTemplate.name}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Redigera" : "Förhandsgranska"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Spara
          </Button>
        </div>
      </div>

      {placeholders.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium mb-1">Tillgängliga platshållare</p>
                <div className="flex flex-wrap gap-2">
                  {placeholders.map((p) => (
                    <TooltipProvider key={p}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="secondary" className="text-xs font-mono">
                            {p.split(" – ")[0]}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>{p.split(" – ")[1]}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showPreview ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Ämne: {editForm.subject}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border rounded-lg p-6 bg-white"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(buildPreviewHtml()) }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Innehåll</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ämnesrad</Label>
                <Input
                  value={editForm.subject || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, subject: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Rubrik</Label>
                <Input
                  value={editForm.heading || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, heading: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Brödtext</Label>
                <Textarea
                  value={editForm.body_text || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, body_text: e.target.value })
                  }
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Knapptext</Label>
                <Input
                  value={editForm.button_text || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, button_text: e.target.value })
                  }
                  placeholder="Lämna tom för att dölja knappen"
                />
              </div>
              <div className="space-y-2">
                <Label>Sidfot</Label>
                <Textarea
                  value={editForm.footer_text || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, footer_text: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Styling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primärfärg</Label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={editForm.primary_color || "#38bdf8"}
                    onChange={(e) =>
                      setEditForm({ ...editForm, primary_color: e.target.value })
                    }
                    className="w-12 h-10 rounded cursor-pointer border"
                  />
                  <Input
                    value={editForm.primary_color || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, primary_color: e.target.value })
                    }
                    className="font-mono"
                    placeholder="#38bdf8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Logotyp URL (valfritt)</Label>
                <Input
                  value={editForm.logo_url || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, logo_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
