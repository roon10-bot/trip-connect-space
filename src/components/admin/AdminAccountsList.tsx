import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserX, Users, Check, X, Trash2, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string | null;
  email_confirmed: boolean;
  is_admin: boolean;
}

export const AdminAccountsList = () => {
  const queryClient = useQueryClient();
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserEmail, setDeleteUserEmail] = useState<string>("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-auth-users"],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users?action=list`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const result = await response.json();
      return result.users as AuthUser[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users?action=delete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete user");
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Kontot har tagits bort");
      queryClient.invalidateQueries({ queryKey: ["admin-auth-users"] });
      setDeleteUserId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users?action=toggle-admin`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to toggle admin");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success(data.isAdmin ? "Användaren är nu admin" : "Admin-rollen har tagits bort");
      queryClient.invalidateQueries({ queryKey: ["admin-auth-users"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDeleteClick = (user: AuthUser) => {
    setDeleteUserId(user.id);
    setDeleteUserEmail(user.email);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Konton</CardTitle>
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Konton</CardTitle>
          <CardDescription>
            Alla registrerade konton ({users?.length || 0} st). Ta bort konton så att de kan skapas på nytt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>E-post</TableHead>
                    <TableHead>Roll</TableHead>
                     <TableHead>Skapad</TableHead>
                     <TableHead>Senaste inloggning</TableHead>
                     <TableHead>Verifierad</TableHead>
                     <TableHead className="w-[120px]">Åtgärd</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {users.map((user) => (
                     <TableRow key={user.id}>
                       <TableCell className="font-medium">
                         {user.full_name || "–"}
                       </TableCell>
                       <TableCell>{user.email}</TableCell>
                       <TableCell>
                         {user.is_admin ? (
                           <Badge variant="default" className="gap-1">
                             <ShieldCheck className="w-3 h-3" />
                             Admin
                           </Badge>
                         ) : (
                           <Badge variant="secondary">Användare</Badge>
                         )}
                       </TableCell>
                       <TableCell>
                         {format(new Date(user.created_at), "d MMM yyyy HH:mm", { locale: sv })}
                       </TableCell>
                       <TableCell>
                         {user.last_sign_in_at
                           ? format(new Date(user.last_sign_in_at), "d MMM yyyy HH:mm", { locale: sv })
                           : "Aldrig"}
                       </TableCell>
                       <TableCell>
                         {user.email_confirmed ? (
                           <Check className="w-4 h-4 text-green-500" />
                         ) : (
                           <X className="w-4 h-4 text-destructive" />
                         )}
                       </TableCell>
                       <TableCell>
                         <div className="flex gap-1">
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => toggleAdminMutation.mutate(user.id)}
                             disabled={toggleAdminMutation.isPending}
                             title={user.is_admin ? "Ta bort admin-roll" : "Gör till admin"}
                           >
                             {user.is_admin ? (
                               <ShieldOff className="w-4 h-4 text-muted-foreground" />
                             ) : (
                               <ShieldCheck className="w-4 h-4 text-primary" />
                             )}
                           </Button>
                           <Button
                             variant="ghost"
                             size="icon"
                             onClick={() => handleDeleteClick(user)}
                             className="text-destructive hover:text-destructive hover:bg-destructive/10"
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
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
               <p className="text-muted-foreground">Inga konton hittades</p>
             </div>
           )}
         </CardContent>
       </Card>

       <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Ta bort konto</AlertDialogTitle>
             <AlertDialogDescription>
               Är du säker på att du vill ta bort kontot för <strong>{deleteUserEmail}</strong>? 
               Detta raderar kontot permanent och personen kan bjudas in på nytt.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Avbryt</AlertDialogCancel>
             <AlertDialogAction
               onClick={() => deleteUserId && deleteMutation.mutate(deleteUserId)}
               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
             >
               {deleteMutation.isPending ? "Tar bort..." : "Ta bort"}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </>
   );
 };
