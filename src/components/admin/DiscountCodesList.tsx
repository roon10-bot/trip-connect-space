import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket } from "lucide-react";

export const DiscountCodesList = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Rabattkoder</CardTitle>
        <CardDescription>
          Hantera rabattkoder för dina resor
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Rabattkodsfunktionen kommer snart</p>
          <p className="text-sm text-muted-foreground">
            Här kommer du kunna skapa och hantera rabattkoder för dina resor
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
