import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  TrendingUp,
  Ship,
  Ticket,
} from "lucide-react";

interface AdminDashboardProps {
  isAdmin: boolean;
  userId?: string;
}

export const AdminDashboard = ({ isAdmin, userId }: AdminDashboardProps) => {
  const { data: trips } = useQuery({
    queryKey: ["admin-trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("departure_date", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: tripBookings } = useQuery({
    queryKey: ["admin-trip-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const revenue30d = (tripBookings || [])
    .filter((b) => new Date(b.created_at) >= thirtyDaysAgo)
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  const bookingsThisWeek = (tripBookings || []).filter(
    (b) => new Date(b.created_at) >= startOfWeek
  ).length;

  const totalTravelers = (tripBookings || []).reduce((sum, b) => sum + (b.travelers || 1), 0);

  const avgFillRate = trips && trips.length > 0
    ? Math.round(
        (trips.reduce((sum, t) => {
          const booked = (tripBookings || []).filter((b) => b.trip_id === t.id).reduce((s, b) => s + (b.travelers || 1), 0);
          return sum + (booked / t.capacity) * 100;
        }, 0) / trips.length)
      )
    : 0;

  return (
    <div className="space-y-10">
      {/* Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Card className="bg-ocean text-white shadow-lg border-0">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center gap-5">
              <div className="p-3.5 rounded-xl bg-cyan/20">
                <TrendingUp className="w-6 h-6 text-cyan" />
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {revenue30d.toLocaleString("sv-SE")} kr
                </p>
                <p className="text-white/60 mt-1">Omsättning (30 dagar)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-ocean text-white shadow-lg border-0">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center gap-5">
              <div className="p-3.5 rounded-xl bg-cyan/20">
                <Ticket className="w-6 h-6 text-cyan" />
              </div>
              <div>
                <p className="text-3xl font-bold">{bookingsThisWeek}</p>
                <p className="text-white/60 mt-1">Bokningar (denna vecka)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-ocean text-white shadow-lg border-0">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center gap-5">
              <div className="p-3.5 rounded-xl bg-cyan/20">
                <Users className="w-6 h-6 text-cyan" />
              </div>
              <div>
                <p className="text-3xl font-bold">{totalTravelers}</p>
                <p className="text-white/60 mt-1">Antal resenärer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-ocean text-white shadow-lg border-0">
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center gap-5">
              <div className="p-3.5 rounded-xl bg-cyan/20">
                <Ship className="w-6 h-6 text-cyan" />
              </div>
              <div>
                <p className="text-3xl font-bold">{avgFillRate}%</p>
                <p className="text-white/60 mt-1">Fyllnadsgrad per resa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
