"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  TruckIcon, 
  CalendarIcon, 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EditVehicleDialog } from "@/components/edit-vehicle-dialog";
import { DeleteVehicleDialog } from "@/components/delete-vehicle-dialog";
import { Badge } from "@/components/ui/badge";

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

interface VehicleDetailClientProps {
  vehicle: Vehicle;
}

export function VehicleDetailClient({ vehicle }: VehicleDetailClientProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const router = useRouter();

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
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
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
                  <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
                  <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                    <CalendarIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
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
