import { useState, useEffect } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Video } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  meet_link: string | null;
}

interface Booking {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  school: string;
  message: string | null;
  created_at: string;
  slot_id: string;
}

export const AdminMeetingSlots = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:30");
  const [meetLink, setMeetLink] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [slotsRes, bookingsRes] = await Promise.all([
      supabase.from("meeting_slots").select("*").order("slot_date").order("start_time"),
      supabase.from("meeting_bookings").select("*").order("created_at", { ascending: false }),
    ]);
    if (slotsRes.data) setSlots(slotsRes.data);
    if (bookingsRes.data) setBookings(bookingsRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addSlot = async () => {
    if (!selectedDate || !user) return;
    setLoading(true);
    const { error } = await supabase.from("meeting_slots").insert({
      slot_date: format(selectedDate, "yyyy-MM-dd"),
      start_time: startTime,
      end_time: endTime,
      meet_link: meetLink || null,
      created_by: user.id,
    });
    if (error) {
      toast.error("Kunde inte lägga till tid");
    } else {
      toast.success("Tid tillagd");
      setMeetLink("");
      fetchData();
    }
    setLoading(false);
  };

  const deleteSlot = async (id: string) => {
    await supabase.from("meeting_slots").delete().eq("id", id);
    toast.success("Tid borttagen");
    fetchData();
  };

  const deleteBooking = async (id: string, slotId: string) => {
    await supabase.from("meeting_bookings").delete().eq("id", id);
    await supabase.from("meeting_slots").update({ is_booked: false }).eq("id", slotId);
    toast.success("Bokning borttagen, tiden är nu ledig igen");
    fetchData();
  };

  const getBookingForSlot = (slotId: string) =>
    bookings.find((b) => b.slot_id === slotId);

  return (
    <div className="space-y-8">
      {/* Add slot */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Lägg till lediga tider
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-xl border border-border p-3 pointer-events-auto"
            locale={sv}
          />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Starttid</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label>Sluttid</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Google Meet-länk (valfritt)</Label>
              <Input
                type="url"
                placeholder="https://meet.google.com/..."
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
              />
            </div>
            {selectedDate && (
              <p className="text-sm text-muted-foreground">
                Datum: {format(selectedDate, "d MMMM yyyy", { locale: sv })}
              </p>
            )}
            <Button onClick={addSlot} disabled={loading || !selectedDate}>
              <Plus className="w-4 h-4 mr-2" />
              Lägg till tid
            </Button>
          </div>
        </div>
      </div>

      {/* Slots list */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Video className="w-5 h-5" />
          Alla tider ({slots.length})
        </h3>
        {slots.length === 0 ? (
          <p className="text-muted-foreground text-sm">Inga tider tillagda ännu.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Tid</TableHead>
                <TableHead>Meet-länk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bokad av</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.map((slot) => {
                const booking = getBookingForSlot(slot.id);
                return (
                  <TableRow key={slot.id}>
                    <TableCell>
                      {format(new Date(slot.slot_date), "d MMM yyyy", { locale: sv })}
                    </TableCell>
                    <TableCell>
                      {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
                    </TableCell>
                    <TableCell>
                      {slot.meet_link ? (
                        <a href={slot.meet_link} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">
                          Öppna
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={slot.is_booked ? "default" : "secondary"}>
                        {slot.is_booked ? "Bokad" : "Ledig"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {booking ? (
                        <div className="text-sm">
                          <p className="font-medium">
                            {booking.first_name} {booking.last_name}
                          </p>
                          <p className="text-muted-foreground">{booking.school}</p>
                          <p className="text-muted-foreground">{booking.email}</p>
                          <p className="text-muted-foreground">{booking.phone}</p>
                          {booking.message && (
                            <p className="text-muted-foreground italic mt-1">"{booking.message}"</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {booking && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteBooking(booking.id, slot.id)}
                            title="Ta bort bokning"
                          >
                            <Trash2 className="w-4 h-4 text-orange-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSlot(slot.id)}
                          title="Ta bort tid"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
