import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, ChevronLeft, ChevronRight, Ban, Check } from "lucide-react";
import { toast } from "sonner";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, addMonths, subMonths,
  isSameMonth, isToday, isBefore, startOfDay,
} from "date-fns";
import { sv } from "date-fns/locale";

interface Props {
  partnerId: string;
}

type DayStatus = "available" | "blocked" | "none";

export const PartnerAvailability = ({ partnerId }: Props) => {
  const queryClient = useQueryClient();
  const [selectedListing, setSelectedListing] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<"block" | "unblock" | null>(null);

  const { data: listings } = useQuery({
    queryKey: ["partnerListings", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_listings")
        .select("id, name, status, daily_price")
        .eq("partner_id", partnerId);
      if (error) throw error;
      return data;
    },
  });

  const listingId = selectedListing || listings?.[0]?.id || "";
  const currentListing = listings?.find((l) => l.id === listingId);
  const dailyPrice = Number(currentListing?.daily_price || 0);

  const { data: availability, isLoading } = useQuery({
    queryKey: ["listingAvailability", listingId],
    queryFn: async () => {
      if (!listingId) return [];
      const { data, error } = await supabase
        .from("listing_availability")
        .select("*")
        .eq("listing_id", listingId)
        .order("week_start", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!listingId,
  });

  // Build a map: dateStr -> { id, is_blocked }
  const dateMap = useMemo(() => {
    const map = new Map<string, { id: string; is_blocked: boolean }>();
    if (!availability) return map;
    for (const a of availability) {
      const start = new Date(a.week_start);
      const end = new Date(a.week_end);
      const days = eachDayOfInterval({ start, end });
      for (const day of days) {
        map.set(format(day, "yyyy-MM-dd"), { id: a.id, is_blocked: a.is_blocked });
      }
    }
    return map;
  }, [availability]);

  // Calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const weekDays = ["mån", "tis", "ons", "tors", "fre", "lör", "sön"];

  const getDayStatus = (dateStr: string): DayStatus => {
    const entry = dateMap.get(dateStr);
    if (!entry) return "none";
    return entry.is_blocked ? "blocked" : "available";
  };

  const toggleDateSelection = (dateStr: string) => {
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  // Batch add available dates
  const addAvailableMutation = useMutation({
    mutationFn: async (dates: string[]) => {
      if (dates.length === 0) return;
      // Group consecutive dates into ranges
      const sorted = [...dates].sort();
      const ranges: { start: string; end: string }[] = [];
      let rangeStart = sorted[0];
      let rangeEnd = sorted[0];

      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(rangeEnd);
        const curr = new Date(sorted[i]);
        const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
          rangeEnd = sorted[i];
        } else {
          ranges.push({ start: rangeStart, end: rangeEnd });
          rangeStart = sorted[i];
          rangeEnd = sorted[i];
        }
      }
      ranges.push({ start: rangeStart, end: rangeEnd });

      for (const range of ranges) {
        const start = new Date(range.start);
        const end = new Date(range.end);
        const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        const price = dailyPrice * nights;

        const { error } = await supabase.from("listing_availability").insert({
          listing_id: listingId,
          week_start: range.start,
          week_end: range.end,
          price_per_week: price,
          is_blocked: false,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listingAvailability", listingId] });
      setSelectedDates(new Set());
      setSelectionMode(null);
      toast.success("Tillgänglighet uppdaterad");
    },
    onError: (e: any) => toast.error(e.message || "Kunde inte uppdatera"),
  });

  // Batch block dates
  const blockDatesMutation = useMutation({
    mutationFn: async (dates: string[]) => {
      for (const dateStr of dates) {
        const entry = dateMap.get(dateStr);
        if (entry) {
          await supabase.from("listing_availability").update({ is_blocked: true }).eq("id", entry.id);
        } else {
          const { error } = await supabase.from("listing_availability").insert({
            listing_id: listingId,
            week_start: dateStr,
            week_end: dateStr,
            price_per_week: dailyPrice,
            is_blocked: true,
          });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listingAvailability", listingId] });
      setSelectedDates(new Set());
      setSelectionMode(null);
      toast.success("Datum blockerade");
    },
    onError: (e: any) => toast.error(e.message || "Kunde inte blockera"),
  });

  // Batch unblock dates
  const unblockDatesMutation = useMutation({
    mutationFn: async (dates: string[]) => {
      for (const dateStr of dates) {
        const entry = dateMap.get(dateStr);
        if (entry) {
          await supabase.from("listing_availability").update({ is_blocked: false }).eq("id", entry.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listingAvailability", listingId] });
      setSelectedDates(new Set());
      setSelectionMode(null);
      toast.success("Datum avblockerade");
    },
    onError: (e: any) => toast.error(e.message || "Kunde inte avblockera"),
  });

  const handleApplySelection = () => {
    const dates = Array.from(selectedDates);
    if (selectionMode === "block") {
      blockDatesMutation.mutate(dates);
    } else if (selectionMode === "unblock") {
      unblockDatesMutation.mutate(dates);
    } else {
      // Default: mark as available
      const newDates = dates.filter((d) => !dateMap.has(d));
      if (newDates.length > 0) {
        addAvailableMutation.mutate(newDates);
      }
    }
  };

  const isPast = (date: Date) => isBefore(date, startOfDay(new Date()));

  const isProcessing = addAvailableMutation.isPending || blockDatesMutation.isPending || unblockDatesMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground">Tillgänglighet & Priser</h2>
        <p className="text-muted-foreground">Hantera vilka datum som är tillgängliga för bokning</p>
      </div>

      {listings && listings.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="space-y-1.5">
            <Select value={listingId} onValueChange={(v) => { setSelectedListing(v); setSelectedDates(new Set()); }}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Välj boende" />
              </SelectTrigger>
              <SelectContent>
                {listings.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {currentListing && (
            <p className="text-sm text-muted-foreground">
              Dygnspris: <span className="font-semibold text-foreground">{dailyPrice.toLocaleString("sv-SE")} kr / natt</span>
            </p>
          )}
        </div>
      )}

      {listingId && (
        <>
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h3 className="text-2xl font-serif font-bold text-foreground capitalize min-w-[180px] text-center">
                {format(currentMonth, "MMMM yyyy", { locale: sv })}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-muted-foreground"
              onClick={() => setCurrentMonth(new Date())}
            >
              Idag
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Calendar Grid */}
              <div className="border rounded-xl overflow-hidden bg-card">
                {/* Week day headers */}
                <div className="grid grid-cols-7 border-b bg-muted/30">
                  {weekDays.map((day) => (
                    <div key={day} className="py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const inMonth = isSameMonth(day, currentMonth);
                    const today = isToday(day);
                    const past = isPast(day);
                    const status = getDayStatus(dateStr);
                    const isSelected = selectedDates.has(dateStr);
                    const isBlocked = status === "blocked";
                    const isAvailable = status === "available";

                    return (
                      <button
                        key={dateStr}
                        disabled={past || !inMonth}
                        onClick={() => {
                          if (!past && inMonth) toggleDateSelection(dateStr);
                        }}
                        className={`
                          relative flex flex-col items-start justify-between
                          p-2.5 min-h-[80px] border-b border-r
                          text-left transition-all duration-100
                          ${!inMonth ? "bg-muted/20 text-muted-foreground/30 cursor-default" : ""}
                          ${past && inMonth ? "bg-muted/10 text-muted-foreground/40 cursor-not-allowed" : ""}
                          ${inMonth && !past ? "hover:bg-accent/50 cursor-pointer" : ""}
                          ${isSelected ? "ring-2 ring-inset ring-primary bg-primary/5" : ""}
                          ${isBlocked && inMonth ? "bg-destructive/5" : ""}
                          ${idx % 7 === 6 ? "border-r-0" : ""}
                        `}
                      >
                        <span className={`
                          text-sm font-medium leading-none
                          ${today ? "bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center -m-0.5" : ""}
                        `}>
                          {format(day, "d")}
                        </span>

                        {inMonth && !past && (
                          <div className="w-full mt-auto">
                            {isBlocked ? (
                              <div className="flex items-center gap-1">
                                <Ban className="w-3 h-3 text-destructive/60" />
                                <span className="text-xs text-destructive/60 line-through">{dailyPrice.toLocaleString("sv-SE")} kr</span>
                              </div>
                            ) : isAvailable ? (
                              <span className="text-xs font-medium text-foreground/70">{dailyPrice.toLocaleString("sv-SE")} kr</span>
                            ) : (
                              <span className="text-xs text-muted-foreground/40">—</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-card border" />
                  <span>Tillgänglig</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-destructive/10 border border-destructive/20" />
                  <span>Blockerad</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-muted/30 border" />
                  <span>Ej tillgänglig</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm ring-2 ring-primary bg-primary/5" />
                  <span>Vald</span>
                </div>
              </div>

              {/* Selection actions */}
              {selectedDates.size > 0 && (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border animate-in slide-in-from-bottom-2">
                  <span className="text-sm font-medium text-foreground">
                    {selectedDates.size} datum valda
                  </span>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectionMode(null);
                      const newDates = Array.from(selectedDates).filter((d) => !dateMap.has(d));
                      if (newDates.length > 0) addAvailableMutation.mutate(newDates);
                      else toast.info("Alla valda datum är redan tillgängliga");
                    }}
                    disabled={isProcessing}
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Markera tillgängliga
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => {
                      setSelectionMode("block");
                      blockDatesMutation.mutate(Array.from(selectedDates));
                    }}
                    disabled={isProcessing}
                  >
                    <Ban className="w-4 h-4 mr-1.5" />
                    Blockera
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setSelectedDates(new Set()); setSelectionMode(null); }}
                  >
                    Avbryt
                  </Button>
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
