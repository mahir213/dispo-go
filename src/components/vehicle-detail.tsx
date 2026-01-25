"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  TruckIcon, 
  CalendarIcon, 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  AlertCircle,
  CheckCircle2,
  PlusIcon,
  WrenchIcon,
  XIcon
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditVehicleDialog } from "@/components/edit-vehicle-dialog";
import { DeleteVehicleDialog } from "@/components/delete-vehicle-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  name: string;
  registrationNumber: string;
  vehicleType: string;
  sixMonthInspectionDate: string | null;
  registrationExpiryDate: string | null;
  ppAparatExpiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceRecord {
  id: string;
  description: string;
  date: string;
  createdAt: string;
}

interface VehicleDetailClientProps {
  vehicle: Vehicle;
}

export function VehicleDetailClient({ vehicle }: VehicleDetailClientProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [newRecord, setNewRecord] = useState({ description: "", date: "" });
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchMaintenanceRecords();
  }, [vehicle.id]);

  const fetchMaintenanceRecords = async () => {
    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}/maintenance`);
      if (response.ok) {
        const data = await response.json();
        setMaintenanceRecords(data);
      }
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const handleAddRecord = async () => {
    if (!newRecord.description || !newRecord.date) {
      toast.error("Molimo unesite opis i datum");
      return;
    }

    try {
      const response = await fetch(`/api/vehicles/${vehicle.id}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });

      if (response.ok) {
        toast.success("Zapis uspješno dodat");
        setNewRecord({ description: "", date: "" });
        setIsAddingRecord(false);
        fetchMaintenanceRecords();
      } else {
        toast.error("Greška pri dodavanju zapisa");
      }
    } catch (error) {
      toast.error("Greška pri dodavanju zapisa");
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      const response = await fetch(
        `/api/vehicles/${vehicle.id}/maintenance?recordId=${recordId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Zapis uspješno obrisan");
        fetchMaintenanceRecords();
      } else {
        toast.error("Greška pri brisanju zapisa");
      }
    } catch (error) {
      toast.error("Greška pri brisanju zapisa");
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

  const getStatusBadge = (date: string | null, label: string) => {
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
            <Link href="/vozila">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{vehicle.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {vehicle.registrationNumber}
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
              <CardDescription>Opći podaci o vozilu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Naziv vozila
                  </label>
                  <p className="text-base font-medium mt-1">{vehicle.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Registarska oznaka
                  </label>
                  <p className="text-base font-mono font-medium mt-1">
                    {vehicle.registrationNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Tip vozila
                  </label>
                  <p className="text-base font-medium mt-1">
                    {vehicle.vehicleType === "KAMION" ? "Kamion" : "Prikolica"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inspection Dates Card */}
          <Card>
            <CardHeader>
              <CardTitle>Datumi isteka</CardTitle>
              <CardDescription>Pregledi i važeći dokumenti</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Šestomjesečni pregled */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Šestomjesečni pregled</h3>
                    {vehicle.sixMonthInspectionDate ? (
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(vehicle.sixMonthInspectionDate), "dd.MM.yyyy")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nije postavljeno</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(vehicle.sixMonthInspectionDate, "Šestomjesečni")}
              </div>

              {/* Registracija */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <Image src="/license-plate.png" alt="Registracija" width={32} height={32} className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-medium">Registracija</h3>
                    {vehicle.registrationExpiryDate ? (
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(vehicle.registrationExpiryDate), "dd.MM.yyyy")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nije postavljeno</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(vehicle.registrationExpiryDate, "Registracija")}
              </div>

              {/* PP Aparat */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <Image src="/fire-extinguisher.png" alt="PP Aparat" width={24} height={24} className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium">PP Aparat</h3>
                    {vehicle.ppAparatExpiryDate ? (
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(vehicle.ppAparatExpiryDate), "dd.MM.yyyy")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nije postavljeno</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(vehicle.ppAparatExpiryDate, "PP Aparat")}
              </div>
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
                    {format(new Date(vehicle.createdAt), "dd.MM.yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Posljednja izmjena
                  </label>
                  <p className="text-sm mt-1">
                    {format(new Date(vehicle.updatedAt), "dd.MM.yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Records Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Servisni zapisi</CardTitle>
                  <CardDescription>Evidencija obavljenih radova</CardDescription>
                </div>
                {!isAddingRecord && (
                  <Button onClick={() => setIsAddingRecord(true)} size="sm">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Dodaj zapis
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAddingRecord && (
                <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
                  <div className="space-y-2">
                    <Label htmlFor="description">Opis rada</Label>
                    <Input
                      id="description"
                      placeholder="npr. Zamjena ulja i filtera"
                      value={newRecord.description}
                      onChange={(e) =>
                        setNewRecord({ ...newRecord, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Datum</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newRecord.date}
                      onChange={(e) =>
                        setNewRecord({ ...newRecord, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddRecord} size="sm">
                      Sačuvaj
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingRecord(false);
                        setNewRecord({ description: "", date: "" });
                      }}
                    >
                      Otkaži
                    </Button>
                  </div>
                </div>
              )}

              {isLoadingRecords ? (
                <div className="text-center py-8 text-muted-foreground">
                  Učitavanje...
                </div>
              ) : maintenanceRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <WrenchIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Nema evidencije servisnih radova</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {maintenanceRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-start justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex gap-4 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                          <WrenchIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{record.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(record.date), "dd.MM.yyyy")}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <EditVehicleDialog
        vehicle={vehicle}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteVehicleDialog
        vehicleId={vehicle.id}
        vehicleName={vehicle.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
