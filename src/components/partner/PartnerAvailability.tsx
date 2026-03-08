import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, Ban, Check } from "lucide-react";
import { toast } from "sonner";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, addMonths, subMonths,
  isSameMonth, isToday, isBefore, startOfDay,
} from "date-fns";
import { sv } from "date-fns/locale";

interface Props { partnerId: string; }
type DayStatus = "available" | "blocked" | "none";

export const PartnerAvailability = ({ partnerId }: Props) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedListing, setSelectedListing] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<"block" | "unblock" | null>(null);

  const { data: listings } = useQuery({
    queryKey: ["partnerListings", partnerId],
    queryFn: async () => {
      const { data, error } = await supabase.from("partner_listings").select("id, name, status, daily_price").eq("partner_id", partnerId);
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
      const { data, error } = await supabase.from("listing_availability").select("*").eq("listing_id", listingId).order("week_start", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!listingId,
  });

  const dateMap = useMemo(() => {
    const map = new Map<string, { id: string; is_blocked: boolean }>();
    if (!availability) return map;
    for (const a of availability) {
      const days = eachDayOfInterval({ start: new Date(a.week_start), end: new Date(a.week_end) });
      for (const day of days) map.set(format(day, "yyyy-MM-dd"), { id: a.id, is_blocked: a.is_blocked });
    }
    return map;
  }, [availability]);

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
    setSelectedDates((prev) => { const next = new Set(prev); next.has(dateStr) ? next.delete(dateStr) : next.add(dateStr); return next; });
  };

  const addAvailableMutation = useMutation({
    mutationFn: async (dates: string[]) => {
      if (dates.length === 0) return;
      const sorted = [...dates].sort();
      const ranges: { start: string; end: string }[] = [];
      let rangeStart = sorted[0], rangeEnd = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        const diff = (new Date(sorted[i]).getTime() - new Date(rangeEnd).getTime()) / 86400000;
        if (diff === 1) { rangeEnd = sorted[i]; } else { ranges.push({ start: rangeStart, end: rangeEnd }); rangeStart = sorted[i]; rangeEnd = sorted[i]; }
      }
      ranges.push({ start: rangeStart, end: rangeEnd });
      for (const range of ranges) {
        const nights = Math.max(1, Math.round((new Date(range.end).getTime() - new Date(range.start).getTime()) / 86400000) + 1);
        const { error } = await supabase.from("listing_availability").insert({ listing_id: listingId, week_start: range.start, week_end: range.end, price_per_week: dailyPrice * nights, is_blocked: false });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["listingAvailability", listingId] }); setSelectedDates(new Set()); setSelectionMode(null); toast.success(t("partner.availability.availabilityUpdated")); },
    onError: (e: any) => toast.error(e.message || t("partner.availability.couldNotUpdate")),
  });

  const blockDatesMutation = useMutation({
    mutationFn: async (dates: string[]) => {
      for (const dateStr of dates) {
        const entry = dateMap.get(dateStr);
        if (entry) { await supabase.from("listing_availability").update({ is_blocked: true }).eq("id", entry.id); }
        else { const { error } = await supabase.from("listing_availability").insert({ listing_id: listingId, week_start: dateStr, week_end: dateStr, price_per_week: dailyPrice, is_blocked: true }); if (error) throw error; }
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["listingAvailability", listingId] }); setSelectedDates(new Set()); setSelectionMode(null); toast.success(t("partner.availability.datesBlocked")); },
    onError: (e: any) => toast.error(e.message || t("partner.availability.couldNotBlock")),
  });

  const unblockDatesMutation = useMutation({
    mutationFn: async (dates: string[]) => {
      for (const dateStr of dates) { const entry = dateMap.get(dateStr); if (entry) await supabase.from("listing_availability").update({ is_blocked: false }).eq("id", entry.id); }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["listingAvailability", listingId] }); setSelectedDates(new Set()); setSelectionMode(null); toast.success(t("partner.availability.datesUnblocked")); },
    onError: (e: any) => toast.error(e.message || t("partner.availability.couldNotUnblock")),
  });

  const isPast = (date: Date) => isBefore(date, startOfDay(new Date()));
  const isProcessing = addAvailableMutation.isPending || blockDatesMutation.isPending || unblockDatesMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground">{t("partner.availability.title")}</h2>
        <p className="text-muted-foreground">{t("partner.availability.subtitle")}</p>
      </div>

      {listings && listings.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <Select value={listingId} onValueChange={(v) => { setSelectedListing(v); setSelectedDates(new Set()); }}>
            <SelectTrigger className="w-64"><SelectValue placeholder={t("partner.availability.selectListing")} /></SelectTrigger>
            <SelectContent>{listings.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
          </Select>
          {currentListing && (
            <p className="text-sm text-muted-foreground">
              {t("partner.availability.dailyPrice")}: <span className="font-semibold text-foreground">{dailyPrice.toLocaleString("sv-SE")} {t("partner.availability.perNight")}</span>
            </p>
          )}
        </div>
      )}

      {listingId && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="w-5 h-5" /></Button>
              <h3 className="text-2xl font-serif font-bold text-foreground capitalize min-w-[180px] text-center">{format(currentMonth, "MMMM yyyy", { locale: sv })}</h3>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="w-5 h-5" /></Button>
            </div>
            <Button variant="ghost" size="sm" className="text-sm text-muted-foreground" onClick={() => setCurrentMonth(new Date())}>{t("partner.availability.today")}</Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="border rounded-xl overflow-hidden bg-card">
                <div className="grid grid-cols-7 border-b bg-muted/30">
                  {weekDays.map((day) => <div key={day} className="py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">{day}</div>)}
                </div>
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
                      <button key={dateStr} disabled={past || !inMonth} onClick={() => { if (!past && inMonth) toggleDateSelection(dateStr); }}
                        className={`relative flex flex-col items-start justify-between p-2.5 min-h-[80px] border-b border-r text-left transition-all duration-100
                          ${!inMonth ? "bg-muted/20 text-muted-foreground/30 cursor-default" : ""}
                          ${past && inMonth ? "bg-muted/10 text-muted-foreground/40 cursor-not-allowed" : ""}
                          ${inMonth && !past ? "hover:bg-accent/50 cursor-pointer" : ""}
                          ${isSelected ? "ring-2 ring-inset ring-primary bg-primary/5" : ""}
                          ${isBlocked && inMonth ? "bg-destructive/5" : ""}
                          ${idx % 7 === 6 ? "border-r-0" : ""}`}
                      >
                        <span className={`text-sm font-medium leading-none ${today ? "bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center -m-0.5" : ""}`}>{format(day, "d")}</span>
                        {inMonth && !past && (
                          <div className="w-full mt-auto">
                            {isBlocked ? (
                              <div className="flex items-center gap-1"><Ban className="w-3 h-3 text-destructive/60" /><span className="text-xs text-destructive/60 line-through">{dailyPrice.toLocaleString("sv-SE")} kr</span></div>
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

              <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-card border" /><span>{t("partner.availability.available")}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-destructive/10 border border-destructive/20" /><span>{t("partner.availability.blocked")}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-muted/30 border" /><span>{t("partner.availability.notAvailable")}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm ring-2 ring-primary bg-primary/5" /><span>{t("partner.availability.selected")}</span></div>
              </div>

              {selectedDates.size > 0 && (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border animate-in slide-in-from-bottom-2">
                  <span className="text-sm font-medium text-foreground">{t("partner.availability.datesSelected", { count: selectedDates.size })}</span>
                  <div className="flex-1" />
                  <Button size="sm" variant="outline" disabled={isProcessing} onClick={() => {
                    const newDates = Array.from(selectedDates).filter((d) => !dateMap.has(d));
                    if (newDates.length > 0) addAvailableMutation.mutate(newDates);
                    else toast.info(t("partner.availability.alreadyAvailable"));
                  }}>
                    <Check className="w-4 h-4 mr-1.5" /> {t("partner.availability.markAvailable")}
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5" disabled={isProcessing} onClick={() => { setSelectionMode("block"); blockDatesMutation.mutate(Array.from(selectedDates)); }}>
                    <Ban className="w-4 h-4 mr-1.5" /> {t("partner.availability.block")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setSelectedDates(new Set()); setSelectionMode(null); }}>{t("partner.availability.cancel")}</Button>
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