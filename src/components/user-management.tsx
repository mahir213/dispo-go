"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { bsLocale } from "@/lib/locale";
import { UserRole } from "@prisma/client";
import { Loader2, Plus, Trash2, Shield, UserCog, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

const createUserSchema = z.object({
  name: z.string().min(2, "Ime mora imati najmanje 2 karaktera"),
  email: z.string().email("Unesite ispravnu email adresu"),
  password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera"),
  role: z.enum(["DISPONENT", "KNJIGOVODJA", "SERVISER"]),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

const roleLabels: Record<UserRole, string> = {
  DIREKTOR: "Direktor",
  DISPONENT: "Disponent",
  KNJIGOVODJA: "Knjigovođa",
  SERVISER: "Serviser",
};

const roleDescriptions: Record<UserRole, string> = {
  DIREKTOR: "Puni pristup svim funkcijama i upravljanje korisnicima",
  DISPONENT: "Puni pristup svim funkcijama osim upravljanja korisnicima",
  KNJIGOVODJA: "Pregled svih podataka i fakturisanje tura",
  SERVISER: "Pregled vozila i bilješki vozila",
};

const roleBadgeVariants: Record<UserRole, "default" | "secondary" | "outline" | "destructive"> = {
  DIREKTOR: "default",
  DISPONENT: "secondary",
  KNJIGOVODJA: "outline",
  SERVISER: "outline",
};

interface UserManagementProps {
  currentUserId: string;
}

export function UserManagement({ currentUserId }: UserManagementProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "DISPONENT",
    },
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error("Greška pri učitavanju korisnika");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data: CreateUserFormValues) => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Greška pri kreiranju korisnika");
      }

      toast.success("Korisnik uspješno kreiran");
      setIsDialogOpen(false);
      form.reset();
      fetchUsers();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri kreiranju korisnika");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Greška pri ažuriranju uloge");
      }

      toast.success("Uloga uspješno ažurirana");
      fetchUsers();
      setEditingUser(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri ažuriranju uloge");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Greška pri brisanju korisnika");
      }

      toast.success("Korisnik uspješno obrisan");
      fetchUsers();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri brisanju korisnika");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <div>
              <CardTitle>Upravljanje korisnicima</CardTitle>
              <CardDescription>
                Dodajte i upravljajte korisnicima sistema
              </CardDescription>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Dodaj korisnika
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Novi korisnik</DialogTitle>
                <DialogDescription>
                  Kreirajte novi korisnički račun
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ime i prezime</FormLabel>
                        <FormControl>
                          <Input placeholder="Unesite ime i prezime" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@primjer.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lozinka</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Unesite lozinku" {...field} />
                        </FormControl>
                        <FormDescription>
                          Lozinka mora imati najmanje 8 karaktera
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Uloga</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Odaberite ulogu" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="DISPONENT">
                              <div className="flex flex-col">
                                <span>Disponent</span>
                                <span className="text-xs text-muted-foreground">
                                  {roleDescriptions.DISPONENT}
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="KNJIGOVODJA">
                              <div className="flex flex-col">
                                <span>Knjigovođa</span>
                                <span className="text-xs text-muted-foreground">
                                  {roleDescriptions.KNJIGOVODJA}
                                </span>
                              </div>
                            </SelectItem>
                            <SelectItem value="SERVISER">
                              <div className="flex flex-col">
                                <span>Serviser</span>
                                <span className="text-xs text-muted-foreground">
                                  {roleDescriptions.SERVISER}
                                </span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Kreiraj korisnika
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Role info cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(["DIREKTOR", "DISPONENT", "KNJIGOVODJA", "SERVISER"] as UserRole[]).map((role) => (
            <div key={role} className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{roleLabels[role]}</span>
              </div>
              <p className="text-xs text-muted-foreground">{roleDescriptions[role]}</p>
            </div>
          ))}
        </div>

        {/* Users table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ime</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Uloga</TableHead>
                <TableHead>Kreiran</TableHead>
                <TableHead className="text-right">Akcije</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {editingUser?.id === user.id ? (
                      <Select
                        defaultValue={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DIREKTOR">Direktor</SelectItem>
                          <SelectItem value="DISPONENT">Disponent</SelectItem>
                          <SelectItem value="KNJIGOVODJA">Knjigovođa</SelectItem>
                          <SelectItem value="SERVISER">Serviser</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={roleBadgeVariants[user.role]}>
                        {roleLabels[user.role]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "dd.MM.yyyy", { locale: bsLocale })}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.id !== currentUserId && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingUser(editingUser?.id === user.id ? null : user)}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Obriši korisnika</AlertDialogTitle>
                              <AlertDialogDescription>
                                Jeste li sigurni da želite obrisati korisnika {user.name}?
                                Ova akcija se ne može poništiti.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Otkaži</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Obriši
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                    {user.id === currentUserId && (
                      <span className="text-xs text-muted-foreground">Vi</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
