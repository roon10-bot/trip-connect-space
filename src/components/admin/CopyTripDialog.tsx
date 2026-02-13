import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { CalendarIcon, Copy } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface CopyTripDialogProps {
  trip: Tables<"trips"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CopyTripDialog = ({ trip, open, onOpenChange }: CopyTripDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [returnDateOpen, setReturnDateOpen] = useState(false);

  const copyMutation = useMutation({
    mutationFn: async () => {
      if (!trip || !user?.id || !departureDate || !returnDate) {
        throw new Error("Fyll i alla fält");
      }

      const { data: newTrip, error } = await supabase
        .from("trips")
        .insert({
          trip_type: trip.trip_type,
          name: trip.name,
          capacity: trip.capacity,
          min_persons: trip.min_persons,
          max_persons: trip.max_persons,
          base_price: trip.base_price,
          departure_date: format(departureDate, "yyyy-MM-dd"),
          return_date: format(returnDate, "yyyy-MM-dd"),
          description: trip.description,
          departure_location: trip.departure_location,
          price: trip.price,
          first_payment_amount: trip.first_payment_amount,
          first_payment_type: trip.first_payment_type,
          first_payment_date: trip.first_payment_date,
          second_payment_amount: trip.second_payment_amount,
          second_payment_type: trip.second_payment_type,
          second_payment_date: trip.second_payment_date,
          final_payment_amount: trip.final_payment_amount,
          final_payment_type: trip.final_payment_type,
          final_payment_date: trip.final_payment_date,
          image_url: trip.image_url,
          is_active: false,
          created_by: user.id,
          accommodation_rooms: trip.accommodation_rooms,
          accommodation_size_sqm: trip.accommodation_size_sqm,
          accommodation_facilities: trip.accommodation_facilities,
          accommodation_address: trip.accommodation_address,
          accommodation_description: trip.accommodation_description,
        })
        .select("id")
        .single();

      if (error) throw error;

      // Copy trip images
      const { data: images } = await supabase
        .from("trip_images")
        .select("*")
        .eq("trip_id", trip.id)
        .order("display_order");

      if (images && images.length > 0 && newTrip) {
        const newImages = images.map((img) => ({
          trip_id: newTrip.id,
          image_url: img.image_url,
          display_order: img.display_order,
        }));
        await supabase.from("trip_images").insert(newImages);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      toast.success("Resa kopierad! Den är inaktiv tills du aktiverar den.");
      onOpenChange(false);
      setDepartureDate(undefined);
      setReturnDate(undefined);
    },
    onError: (error) => {
      console.error("Error copying trip:", error);
      toast.error("Kunde inte kopiera resan");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Kopiera resa</DialogTitle>
          <DialogDescription>
            Kopiera "{trip?.name}" med nya datum. Resan skapas som inaktiv.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Avgångsdatum</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !departureDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {departureDate
                    ? format(departureDate, "PPP", { locale: sv })
                    : "Välj avgångsdatum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={departureDate}
                  onSelect={(date) => {
                    setDepartureDate(date);
                    if (date) {
                      setTimeout(() => setReturnDateOpen(true), 150);
                    }
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Hemresedatum</label>
            <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !returnDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {returnDate
                    ? format(returnDate, "PPP", { locale: sv })
                    : "Välj hemresedatum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={returnDate}
                  onSelect={(date) => {
                    setReturnDate(date);
                    setReturnDateOpen(false);
                  }}
                  disabled={(date) =>
                    date < new Date() ||
                    (departureDate ? date <= departureDate : false)
                  }
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={() => copyMutation.mutate()}
            disabled={!departureDate || !returnDate || copyMutation.isPending}
          >
            <Copy className="w-4 h-4 mr-2" />
            {copyMutation.isPending ? "Kopierar..." : "Kopiera resa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
