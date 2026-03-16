import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ManualPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingName: string;
}

const PAYMENT_PROVIDERS = [
  { value: "altapay", label: "AltaPay" },
  { value: "swish", label: "Swish" },
  { value: "klarna", label: "Klarna" },
  { value: "zaver", label: "Zaver" },
  { value: "manual", label: "Annan" },
];

const PAYMENT_TYPES = [
  { value: "first", label: "Bokningsavgift" },
  { value: "second", label: "Delbetalning 2" },
  { value: "final", label: "Slutbetalning" },
  { value: "full", label: "Fullbetalning" },
];

export const ManualPaymentDialog = ({
  open,
  onOpenChange,
  bookingId,
  bookingName,
}: ManualPaymentDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [paidDate, setPaidDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [note, setNote] = useState("");

  const resetForm = () => {
    setAmount("");
    setProvider("");
    setPaymentType("");
    setPaidDate(new Date().toISOString().split("T")[0]);
    setNote("");
  };

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Ange ett giltigt belopp");
      }
      if (!provider) throw new Error("Välj betalningstyp");
      if (!paymentType) throw new Error("Välj betalningsplan-typ");

      const { error } = await supabase.from("payments").insert({
        trip_booking_id: bookingId,
        user_id: user?.id || null,
        amount: parsedAmount,
        payment_type: paymentType,
        payment_provider: provider,
        status: "completed",
        paid_at: new Date(paidDate).toISOString(),
        provider_transaction_id: `manual_${Date.now()}`,
      });

      if (error) throw error;

      // Log activity
      await supabase.from("booking_activity_log").insert({
        trip_booking_id: bookingId,
        activity_type: "manual_payment",
        description: `Manuell betalning registrerad: ${parsedAmount.toLocaleString("sv-SE")} kr via ${PAYMENT_PROVIDERS.find((p) => p.value === provider)?.label || provider}${note ? ` — ${note}` : ""}`,
        metadata: {
          amount: parsedAmount,
          provider,
          payment_type: paymentType,
          paid_date: paidDate,
          note: note || null,
          registered_by: user?.id,
        },
        created_by: user?.id || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trip-bookings-with-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-booking-activity", bookingId] });
      toast.success("Manuell betalning registrerad");
      resetForm();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Kunde inte registrera betalningen");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            Lägg till manuell betalning
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <Label>
              Summa <span className="text-destructive">*</span>
            </Label>
            <Input
              type="number"
              placeholder="Summa"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Betalningssätt <span className="text-destructive">*</span>
            </Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Välj..." />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Betalningstyp <span className="text-destructive">*</span>
            </Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger>
                <SelectValue placeholder="Välj..." />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Betalningsdatum <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label>Anteckning</Label>
            <Textarea
              placeholder="T.ex. 'Kontant på kontoret', 'Banköverföring mottagen'"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={() => createPaymentMutation.mutate()}
            disabled={
              createPaymentMutation.isPending ||
              !amount ||
              !provider ||
              !paymentType
            }
          >
            {createPaymentMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
