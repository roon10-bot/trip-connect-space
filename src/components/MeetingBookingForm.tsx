import { useState, useEffect } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { CalendarIcon, Clock, CheckCircle, Video } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
}

export const MeetingBookingForm = () => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    school: "",
    message: "",
  });

  useEffect(() => {
    const fetchSlots = async () => {
      const { data } = await supabase
        .from("meeting_slots")
        .select("*")
        .eq("is_booked", false)
        .gte("slot_date", new Date().toISOString().split("T")[0])
        .order("slot_date")
        .order("start_time");
      if (data) setSlots(data);
    };
    fetchSlots();
  }, []);

  const availableDates = [...new Set(slots.map((s) => s.slot_date))];

  const slotsForDate = selectedDate
    ? slots.filter((s) => s.slot_date === format(selectedDate, "yyyy-MM-dd"))
    : [];

  const isDayAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availableDates.includes(dateStr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setLoading(true);
    try {
      const { error: bookingError } = await supabase
        .from("meeting_bookings")
        .insert({
          slot_id: selectedSlot.id,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          school: form.school,
          message: form.message || null,
        });

      if (bookingError) throw bookingError;

      // Mark slot as booked
      await supabase
        .from("meeting_slots")
        .update({ is_booked: true })
        .eq("id", selectedSlot.id);

      setSuccess(true);
      toast.success("Mötet är bokat!");
    } catch {
      toast.error("Något gick fel. Försök igen.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-serif font-bold text-foreground mb-2">
          Mötet är bokat!
        </h3>
        <p className="text-muted-foreground">
          Vi återkommer med en länk till videosamtalet via mejl.
        </p>
      </motion.div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          Det finns inga lediga tider just nu. Kontakta oss direkt istället!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Step 1: Pick date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Label className="text-base font-bold mb-3 block">
            <CalendarIcon className="w-4 h-4 inline mr-2" />
            Välj datum
          </Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedSlot(null);
            }}
            disabled={(date) => !isDayAvailable(date)}
            className="rounded-xl border border-border p-3 pointer-events-auto"
            locale={sv}
          />
        </div>

        <div>
          <Label className="text-base font-bold mb-3 block">
            <Clock className="w-4 h-4 inline mr-2" />
            Välj tid
          </Label>
          <AnimatePresence mode="wait">
            {selectedDate && slotsForDate.length > 0 ? (
              <motion.div
                key={format(selectedDate, "yyyy-MM-dd")}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-3"
              >
                {slotsForDate.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      "p-3 rounded-lg border text-sm font-medium transition-all",
                      selectedSlot?.id === slot.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 text-foreground"
                    )}
                  >
                    {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                  </button>
                ))}
              </motion.div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {selectedDate
                  ? "Inga tider tillgängliga detta datum."
                  : "Välj ett datum i kalendern."}
              </p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Step 2: Contact info */}
      {selectedSlot && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm">
            <strong>Vald tid:</strong>{" "}
            {format(new Date(selectedSlot.slot_date), "d MMMM yyyy", { locale: sv })},{" "}
            {selectedSlot.start_time.slice(0, 5)} – {selectedSlot.end_time.slice(0, 5)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">Förnamn *</Label>
              <Input
                id="first_name"
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Efternamn *</Label>
              <Input
                id="last_name"
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">E-post *</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon *</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="school">Skola / Organisation *</Label>
              <Input
                id="school"
                required
                value={form.school}
                onChange={(e) => setForm({ ...form, school: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="message">Meddelande (valfritt)</Label>
              <Textarea
                id="message"
                rows={3}
                placeholder="Berätta kort om er grupp och vad ni är intresserade av..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="w-full bg-gradient-ocean hover:opacity-90"
          >
            {loading ? "Bokar..." : "Boka videosamtal"}
          </Button>
        </motion.div>
      )}
    </form>
  );
};
