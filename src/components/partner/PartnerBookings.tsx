import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ClipboardList } from "lucide-react";

interface Props {
  partnerId: string;
}

export const PartnerBookings = ({ partnerId }: Props) => {
  // For now, show a placeholder since bookings need to be linked to listings
  // This will be expanded when the booking flow integrates partner listings
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground">Bokningar</h2>
        <p className="text-muted-foreground">Se bokningar kopplade till dina boenden</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Inga bokningar ännu</p>
          <p className="text-sm text-muted-foreground mt-1">Bokningar visas här när resenärer bokar dina boenden</p>
        </CardContent>
      </Card>
    </div>
  );
};
