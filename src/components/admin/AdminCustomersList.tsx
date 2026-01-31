import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Mail, Phone } from "lucide-react";

interface Customer {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

export const AdminCustomersList = () => {
  const { data: customers, isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_bookings")
        .select("first_name, last_name, email, phone")
        .order("last_name", { ascending: true });

      if (error) throw error;

      // Remove duplicates based on email
      const uniqueCustomers = data.reduce((acc: Customer[], current) => {
        const exists = acc.find((item) => item.email === current.email);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

      return uniqueCustomers;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Kunder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Kunder</CardTitle>
        <CardDescription>
          Alla kunder som har bokat en resa ({customers?.length || 0} st)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {customers && customers.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Förnamn</TableHead>
                  <TableHead>Efternamn</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead>Telefon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer, index) => (
                  <TableRow key={`${customer.email}-${index}`}>
                    <TableCell className="font-medium">{customer.first_name}</TableCell>
                    <TableCell>{customer.last_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${customer.email}`}
                          className="text-primary hover:underline"
                        >
                          {customer.email}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={`tel:${customer.phone}`}
                          className="hover:underline"
                        >
                          {customer.phone}
                        </a>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Inga kunder ännu</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
