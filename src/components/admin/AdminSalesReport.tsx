import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Download, FileSpreadsheet, FileText, Filter, Columns3, Search } from "lucide-react";
import { toast } from "sonner";

// Column definitions
const ALL_COLUMNS = [
  { key: "booking_id", label: "Bokningsnummer" },
  { key: "customer_name", label: "Kundnamn" },
  { key: "passport_number", label: "Passnummer" },
  { key: "paid_amount", label: "Betalt hittills" },
  { key: "remaining_amount", label: "Kvar att betala" },
  { key: "remaining_percent", label: "Kvar att betala (%)" },
  { key: "project_number", label: "Projektnummer" },
  { key: "project_name", label: "Projektnamn" },
  { key: "booked_by", label: "Bokad av" },
  { key: "trip_price", label: "Pris för resan" },
  { key: "discount_amount", label: "Rabatt (belopp)" },
  { key: "discount_code", label: "Rabattkod" },
  { key: "departure_date", label: "Avgångsdatum" },
  { key: "trip_name", label: "Namn på resan" },
  { key: "transaction_dates", label: "Transaktionsdatum" },
  { key: "email", label: "Mailadress" },
  { key: "birth_date", label: "Födelsedatum" },
  { key: "address", label: "Bostadsadress" },
  { key: "phone", label: "Telefonnummer" },
  { key: "school", label: "Skola" },
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

const DEFAULT_COLUMNS: ColumnKey[] = [
  "booking_id",
  "customer_name",
  "trip_name",
  "departure_date",
  "trip_price",
  "paid_amount",
  "remaining_amount",
  "remaining_percent",
  "email",
];

type DateFilterType = "booking_date" | "departure_date";

export const AdminSalesReport = () => {
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("booking_date");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>(DEFAULT_COLUMNS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTripId, setSelectedTripId] = useState<string>("all");
  const [hasSearched, setHasSearched] = useState(false);

  // Fetch trips for filter dropdown
  const { data: allTrips } = useQuery({
    queryKey: ["admin-trips-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("id, name, departure_date, project_number")
        .order("departure_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
  // Fetch bookings with related data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ["admin-sales-report", dateFilterType, startDate, endDate, activeOnly, selectedTripId, hasSearched],
    queryFn: async () => {
      if (!hasSearched) return null;
      // Fetch bookings
      let bookingsQuery = supabase
        .from("trip_bookings")
        .select(`
          *,
          trips (
            name,
            trip_type,
            departure_date,
            return_date,
            price,
            project_number
          )
        `)
        .order("created_at", { ascending: false });

      if (selectedTripId !== "all") {
        bookingsQuery = bookingsQuery.eq("trip_id", selectedTripId);
      }

      if (activeOnly) {
        bookingsQuery = bookingsQuery.in("status", ["pending", "preliminary", "confirmed"]);
      }

      if (startDate) {
        if (dateFilterType === "booking_date") {
          bookingsQuery = bookingsQuery.gte("created_at", `${startDate}T00:00:00`);
        }
      }
      if (endDate) {
        if (dateFilterType === "booking_date") {
          bookingsQuery = bookingsQuery.lte("created_at", `${endDate}T23:59:59`);
        }
      }

      const { data: bookings, error: bookingsError } = await bookingsQuery;
      if (bookingsError) throw bookingsError;

      let filtered = bookings || [];

      // Filter by departure date if needed
      if (dateFilterType === "departure_date") {
        filtered = filtered.filter((b) => {
          const depDate = (b.trips as any)?.departure_date;
          if (!depDate) return false;
          if (startDate && depDate < startDate) return false;
          if (endDate && depDate > endDate) return false;
          return true;
        });
      }

      // Fetch payments for these bookings
      const bookingIds = filtered.map((b) => b.id);
      if (bookingIds.length === 0) return [];

      const { data: payments } = await supabase
        .from("payments")
        .select("trip_booking_id, amount, status, paid_at")
        .in("trip_booking_id", bookingIds);

      // Fetch travelers for passport/address/school
      const { data: travelers } = await supabase
        .from("trip_booking_travelers")
        .select("trip_booking_id, first_name, last_name, passport_number, address, school, email, phone, birth_date")
        .in("trip_booking_id", bookingIds);

      // Fetch profiles for "booked by" info
      const userIds = [...new Set(filtered.map((b) => b.user_id).filter((id): id is string => !!id))];
      let profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        if (profiles) {
          profiles.forEach((p) => {
            profilesMap[p.user_id] = p.full_name || "";
          });
        }
      }

      // Build report rows
      return filtered.map((booking) => {
        const trip = booking.trips as any;
        const bookingPayments = (payments || []).filter(
          (p) => p.trip_booking_id === booking.id
        );
        const completedPayments = bookingPayments.filter(
          (p) => p.status === "completed"
        );
        const paidAmount = completedPayments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );
        const totalPrice = Number(booking.total_price);
        const remainingAmount = Math.max(0, totalPrice - paidAmount);
        const remainingPercent =
          totalPrice > 0
            ? Math.round((remainingAmount / totalPrice) * 100)
            : 0;

        const transactionDates = completedPayments
          .filter((p) => p.paid_at)
          .map((p) => format(new Date(p.paid_at!), "yyyy-MM-dd"))
          .join(", ");

        // Get primary traveler data
        const primaryTraveler = (travelers || []).find(
          (t) => t.trip_booking_id === booking.id
        );

        const bookedByName = booking.user_id
          ? profilesMap[booking.user_id] || booking.email
          : booking.email;

        return {
          booking_id: booking.id.slice(0, 8).toUpperCase(),
          booking_id_full: booking.id,
          customer_name: `${booking.first_name} ${booking.last_name}`,
          passport_number: primaryTraveler?.passport_number || "-",
          paid_amount: paidAmount,
          remaining_amount: remainingAmount,
          remaining_percent: remainingPercent,
          project_number: trip?.project_number || "-",
          project_name: trip?.name || "-",
          booked_by: bookedByName,
          trip_price: totalPrice,
          discount_amount: Number(booking.discount_amount) || 0,
          discount_code: booking.discount_code || "-",
          departure_date: trip?.departure_date || "-",
          trip_name: trip?.name || "-",
          transaction_dates: transactionDates || "-",
          email: booking.email,
          birth_date: booking.birth_date
            ? booking.birth_date.substring(0, 6) + "****"
            : "-",
          address: primaryTraveler?.address || "-",
          phone: booking.phone,
          school: primaryTraveler?.school || "-",
          status: booking.status,
        };
      });
    },
  });

  const toggleColumn = (key: ColumnKey) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const selectAllColumns = () => setSelectedColumns(ALL_COLUMNS.map((c) => c.key));
  const deselectAllColumns = () => setSelectedColumns([]);

  const visibleColumns = useMemo(
    () => ALL_COLUMNS.filter((c) => selectedColumns.includes(c.key)),
    [selectedColumns]
  );

  const filteredData = useMemo(() => {
    if (!reportData) return [];
    if (!searchQuery.trim()) return reportData;
    const q = searchQuery.toLowerCase();
    return reportData.filter((row) => {
      const searchable = [
        row.customer_name,
        row.email,
        row.booking_id,
        row.trip_name,
        row.phone,
        row.project_number,
        row.discount_code,
        row.school,
      ].join(" ").toLowerCase();
      return searchable.includes(q);
    });
  }, [reportData, searchQuery]);

  const formatCellValue = (key: ColumnKey, value: any): string => {
    if (key === "paid_amount" || key === "remaining_amount" || key === "trip_price" || key === "discount_amount") {
      return `${Number(value).toLocaleString("sv-SE")} kr`;
    }
    if (key === "remaining_percent") {
      return `${value}%`;
    }
    if (key === "departure_date" && value !== "-") {
      try {
        return format(new Date(value), "d MMM yyyy", { locale: sv });
      } catch {
        return value;
      }
    }
    return String(value ?? "-");
  };

  const exportToExcel = async () => {
    if (!reportData || reportData.length === 0) {
      toast.error("Inga data att exportera");
      return;
    }
    const XLSX = await import("xlsx");
    const headers = visibleColumns.map((c) => c.label);
    const rows = reportData.map((row) =>
      visibleColumns.map((col) => {
        const val = (row as any)[col.key];
        if (["paid_amount", "remaining_amount", "trip_price", "discount_amount"].includes(col.key)) {
          return Number(val);
        }
        if (col.key === "remaining_percent") return Number(val);
        return formatCellValue(col.key, val);
      })
    );

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Försäljningsrapport");
    XLSX.writeFile(wb, `forsaljningsrapport_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Excel-fil nedladdad");
  };

  const exportToPDF = async () => {
    if (!reportData || reportData.length === 0) {
      toast.error("Inga data att exportera");
      return;
    }
    const { default: jsPDF } = await import("jspdf");
    await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.text("Försäljningsrapport", 14, 15);
    doc.setFontSize(9);
    doc.text(
      `Genererad: ${format(new Date(), "yyyy-MM-dd HH:mm")} | Filter: ${dateFilterType === "booking_date" ? "Bokningsdatum" : "Avresedatum"}${startDate ? ` från ${startDate}` : ""}${endDate ? ` till ${endDate}` : ""} | ${activeOnly ? "Endast aktiva" : "Alla bokningar"}`,
      14,
      22
    );

    const headers = visibleColumns.map((c) => c.label);
    const rows = reportData.map((row) =>
      visibleColumns.map((col) => formatCellValue(col.key, (row as any)[col.key]))
    );

    (doc as any).autoTable({
      head: [headers],
      body: rows,
      startY: 28,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [14, 62, 80], fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`forsaljningsrapport_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF-fil nedladdad");
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filterinställningar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label>Filtrera på</Label>
              <Select
                value={dateFilterType}
                onValueChange={(v) => setDateFilterType(v as DateFilterType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="booking_date">Bokningsdatum</SelectItem>
                  <SelectItem value="departure_date">Avresedatum</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Startdatum</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Slutdatum</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Resa</Label>
              <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                <SelectTrigger>
                  <SelectValue placeholder="Alla resor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla resor</SelectItem>
                  {allTrips?.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.name} {trip.project_number ? `(${trip.project_number})` : ""} {trip.departure_date ? `– ${format(new Date(trip.departure_date), "d MMM yyyy", { locale: sv })}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pb-1">
              <Checkbox
                id="active-only"
                checked={activeOnly}
                onCheckedChange={(checked) => setActiveOnly(checked === true)}
              />
              <Label htmlFor="active-only" className="cursor-pointer">
                Endast aktiva bokningar
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={() => setHasSearched(true)} className="px-6">
              <Search className="w-4 h-4 mr-2" />
              Sök
            </Button>
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Filtrera resultat: namn, e-post, bokningsnr..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                disabled={!hasSearched || !reportData}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {/* Column selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Columns3 className="w-4 h-4 mr-2" />
                  Kolumner ({selectedColumns.length}/{ALL_COLUMNS.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 max-h-80 overflow-auto" align="start">
                <div className="space-y-1">
                  <div className="flex gap-2 mb-3">
                    <Button variant="ghost" size="sm" onClick={selectAllColumns}>
                      Markera alla
                    </Button>
                    <Button variant="ghost" size="sm" onClick={deselectAllColumns}>
                      Avmarkera alla
                    </Button>
                  </div>
                  {ALL_COLUMNS.map((col) => (
                    <div key={col.key} className="flex items-center gap-2">
                      <Checkbox
                        id={`col-${col.key}`}
                        checked={selectedColumns.includes(col.key)}
                        onCheckedChange={() => toggleColumn(col.key)}
                      />
                      <Label htmlFor={`col-${col.key}`} className="text-sm cursor-pointer">
                        {col.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Export buttons */}
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Ladda ner Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <FileText className="w-4 h-4 mr-2" />
              Ladda ner PDF
            </Button>

            {hasSearched && filteredData && (
              <Badge variant="secondary" className="ml-auto">
                {filteredData.length} bokningar
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredData && filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.map((col) => (
                      <TableHead key={col.key} className="whitespace-nowrap text-xs">
                        {col.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, idx) => (
                    <TableRow key={idx}>
                      {visibleColumns.map((col) => (
                        <TableCell key={col.key} className="whitespace-nowrap text-sm">
                          {formatCellValue(col.key, (row as any)[col.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {hasSearched
                  ? "Inga bokningar hittades med valda filter"
                  : "Ange filter ovan och tryck Sök för att visa bokningar"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
