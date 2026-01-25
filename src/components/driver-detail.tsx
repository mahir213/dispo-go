"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  UserIcon, 
  CalendarIcon, 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  AlertCircle,
  CheckCircle2,
  PlusIcon,
  MessageSquareIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  XIcon,
  PhoneIcon,
  MailIcon,
  CreditCardIcon
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditDriverDialog } from "@/components/edit-driver-dialog";
import { DeleteDriverDialog } from "@/components/delete-driver-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface DriverNote {
  id: string;
  content: string;
  noteType: "POSITIVE" | "NEGATIVE";
  createdAt: string;
}

interface Driver {
  id: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  licenseNumber: string;
  licenseExpiryDate: string | null;
  medicalExamExpiryDate: string | null;
  driverCardExpiryDate: string | null;
  createdAt: string;
  updatedAt: string;
  notes: DriverNote[];
}

interface DriverDetailClientProps {
  driver: Driver;
}

export function DriverDetailClient({ driver: initialDriver }: DriverDetailClientProps) {
  const [driver, setDriver] = useState(initialDriver);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ content: "", noteType: "POSITIVE" as "POSITIVE" | "NEGATIVE" });
  const router = useRouter();

  const fetchDriver = async () => {
    try {
      const response = await fetch(`/api/drivers/${driver.id}`);
      if (response.ok) {
        const data = await response.json();
        setDriver(data);
      }
    } catch (error) {
      console.error("Error fetching driver:", error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.content) {
      toast.error("Molimo unesite sadržaj bilješke");
      return;
    }

    try {
      const response = await fetch(`/api/drivers/${driver.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });

      if (response.ok) {
        toast.success("Bilješka uspješno dodana");
        setNewNote({ content: "", noteType: "POSITIVE" });
        setIsAddingNote(false);
        fetchDriver();
      } else {
        toast.error("Greška pri dodavanju bilješke");
      }
    } catch (error) {
      toast.error("Greška pri dodavanju bilješke");
    }
  };

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const expiryDate = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const getStatusBadge = (date: string | null) => {
    if (!date) {
      return null;
    }

    if (isExpired(date)) {
      return (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Isteklo</span>
        </div>
      );
    }

    if (isExpiringSoon(date)) {
      return (
        <div className="flex items-center gap-2 text-orange-500">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Uskoro ističe</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm">Uredno</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b ml-[300px]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vozaci">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{driver.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {driver.licenseNumber}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <PencilIcon className="h-4 w-4 mr-2" />
            Uredi
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <TrashIcon className="h-4 w-4 mr-2" />
            Obriši
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Osnovne informacije</CardTitle>
              <CardDescription>Kontakt podaci vozača</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Ime i prezime
                  </label>
                  <p className="text-base font-medium mt-1">{driver.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Broj dozvole
                  </label>
                  <p className="text-base font-mono font-medium mt-1">
                    {driver.licenseNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4" />
                    Telefon
                  </label>
                  <p className="text-base font-medium mt-1">{driver.phoneNumber}</p>
                </div>
                {driver.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MailIcon className="h-4 w-4" />
                      Email
                    </label>
                    <p className="text-base font-medium mt-1">{driver.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document Expiry Dates Card */}
          <Card>
            <CardHeader>
              <CardTitle>Datumi isteka</CardTitle>
              <CardDescription>Važeći dokumenti i pregledi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vozačka dozvola */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCardIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Vozačka dozvola</h3>
                    {driver.licenseExpiryDate ? (
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(driver.licenseExpiryDate), "dd.MM.yyyy")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nije postavljeno</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(driver.licenseExpiryDate)}
              </div>

              {/* Liječnički pregled */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Liječnički pregled</h3>
                    {driver.medicalExamExpiryDate ? (
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(driver.medicalExamExpiryDate), "dd.MM.yyyy")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nije postavljeno</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(driver.medicalExamExpiryDate)}
              </div>

              {/* Tahografska kartica */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCardIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Tahografska kartica</h3>
                    {driver.driverCardExpiryDate ? (
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(driver.driverCardExpiryDate), "dd.MM.yyyy")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nije postavljeno</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(driver.driverCardExpiryDate)}
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bilješke</CardTitle>
                  <CardDescription>Pozitivne i negativne bilješke o vozaču</CardDescription>
                </div>
                {!isAddingNote && (
                  <Button onClick={() => setIsAddingNote(true)} size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Dodaj bilješku
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAddingNote && (
                <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                  <div className="space-y-2">
                    <Label>Tip bilješke</Label>
                    <RadioGroup
                      value={newNote.noteType}
                      onValueChange={(value: string) =>
                        setNewNote({ ...newNote, noteType: value as "POSITIVE" | "NEGATIVE" })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="POSITIVE" id="positive" />
                        <Label htmlFor="positive" className="flex items-center gap-2 cursor-pointer">
                          <ThumbsUpIcon className="h-4 w-4 text-green-600" />
                          Pozitivna
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="NEGATIVE" id="negative" />
                        <Label htmlFor="negative" className="flex items-center gap-2 cursor-pointer">
                          <ThumbsDownIcon className="h-4 w-4 text-red-600" />
                          Negativna
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Sadržaj bilješke</Label>
                    <Textarea
                      id="content"
                      placeholder="Unesite bilješku..."
                      value={newNote.content}
                      onChange={(e) =>
                        setNewNote({ ...newNote, content: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddNote} size="sm">
                      Sačuvaj
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingNote(false);
                        setNewNote({ content: "", noteType: "POSITIVE" });
                      }}
                    >
                      Otkaži
                    </Button>
                  </div>
                </div>
              )}

              {driver.notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquareIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Nema bilješki</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {driver.notes.map((note) => (
                    <div
                      key={note.id}
                      className={`p-4 rounded-lg border ${
                        note.noteType === "POSITIVE"
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                          : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          note.noteType === "POSITIVE"
                            ? "bg-green-100 dark:bg-green-900/40"
                            : "bg-red-100 dark:bg-red-900/40"
                        }`}>
                          {note.noteType === "POSITIVE" ? (
                            <ThumbsUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <ThumbsDownIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{note.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(note.createdAt), "dd.MM.yyyy HH:mm")}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          title="Obriši bilješku"
                          onClick={async () => {
                            const res = await fetch(`/api/drivers/${driver.id}/notes`, {
                              method: "DELETE",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ noteId: note.id }),
                            });
                            if (res.ok) {
                              toast.success("Bilješka obrisana");
                              fetchDriver();
                            } else {
                              toast.error("Greška pri brisanju bilješke");
                            }
                          }}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dodatne informacije</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Datum kreiranja
                  </label>
                  <p className="text-sm mt-1">
                    {format(new Date(driver.createdAt), "dd.MM.yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Posljednja izmjena
                  </label>
                  <p className="text-sm mt-1">
                    {format(new Date(driver.updatedAt), "dd.MM.yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <EditDriverDialog
        driver={driver}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteDriverDialog
        driverId={driver.id}
        driverName={driver.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
