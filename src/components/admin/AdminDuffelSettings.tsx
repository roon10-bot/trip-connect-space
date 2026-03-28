import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, TestTube, Plane, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AdminDuffelSettings = () => {
  const [testMode, setTestMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchTestMode();
  }, []);

  const fetchTestMode = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "DUFFEL_TEST_MODE")
        .maybeSingle();

      if (!error && data) {
        setTestMode(data.value === "true");
      }
    } catch {
      // Default to false
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    setToggling(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          { key: "DUFFEL_TEST_MODE", value: checked ? "true" : "false", updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      if (error) throw error;

      setTestMode(checked);
      toast.success(
        checked
          ? "Testläge aktiverat — Duffel-sökning och bokning använder nu testnyckeln"
          : "Produktionsläge aktivt — Duffel använder skarpa nyckeln"
      );
    } catch (err) {
      toast.error("Kunde inte ändra Duffel-miljö");
      console.error(err);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Laddar Duffel-inställningar...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <Plane className="w-5 h-5 text-primary" />
          Duffel-miljö (flyg)
        </CardTitle>
        <CardDescription>
          Växla mellan Duffel testmiljö och produktionsmiljö i realtid
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-4">
            {testMode ? (
              <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <TestTube className="w-5 h-5 text-amber-600" />
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            )}
            <div>
              <p className="font-medium">
                {testMode ? "Testmiljö" : "Produktionsmiljö"}
              </p>
              <p className="text-sm text-muted-foreground">
                {testMode
                  ? "Flygsökningar och bokningar använder DUFFEL_TEST_API_KEY"
                  : "Flygsökningar och bokningar använder DUFFEL_API_KEY — skarpt läge"}
              </p>
            </div>
          </div>
          <Badge variant={testMode ? "secondary" : "default"} className={testMode ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}>
            {testMode ? "TEST" : "PRODUKTION"}
          </Badge>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-lg border">
          <Switch
            id="duffel-test-mode"
            checked={testMode}
            onCheckedChange={handleToggle}
            disabled={toggling}
          />
          <Label htmlFor="duffel-test-mode" className="cursor-pointer">
            {toggling ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Byter miljö...
              </span>
            ) : (
              "Aktivera testläge"
            )}
          </Label>
        </div>

        {testMode && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">Testläge aktivt</p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                Alla flygbokningar sker mot Duffels testmiljö. Inga riktiga biljetter köps. Glöm inte att byta tillbaka innan ni går live!
              </p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Testläge använder DUFFEL_TEST_API_KEY (duffel_test_...)</p>
          <p>• Påverkar flygsökning, bokningsinitiering och flygköp vid betalning</p>
          <p>• Ändringen gäller omedelbart för alla nya förfrågningar</p>
        </div>
      </CardContent>
    </Card>
  );
};
