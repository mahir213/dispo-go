"use client";

import { formatDistanceToNow, format } from "date-fns";
import { hr } from "date-fns/locale";
import { TruckIcon, CalendarIcon, PlusIcon, AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddVehicleDialog } from "@/components/add-vehicle-dialog";
import { useEffect, useState } from "react";

type Vehicle = {
  id: string;
  name: string;
  registrationNumber: string;
  vehicleType: string;
  sixMonthInspectionDate: string | null;
  registrationExpiryDate: string | null;
  ppAparatExpiryDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export function VehiclesList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((res) => res.json())
      .then((data) => {
        setVehicles(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading vehicles:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <VehiclesLoading />;
  }

  if (vehicles.length === 0) {
    return <VehiclesEmpty />;
  }

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto">
      {/* Table Header */}
      <div className="flex items-center gap-6 px-8 py-4 bg-muted/50 border-y text-sm font-medium text-muted-foreground">
        <div className="flex-1 min-w-0">Vozilo</div>
        <div className="w-32 flex-shrink-0">Tip</div>
        <div className="w-40 flex-shrink-0">Status</div>
        <div className="w-40 flex-shrink-0">Ažurirano</div>
        <div className="w-12 flex-shrink-0" aria-label="Actions"></div>
      </div>
      
      {/* Table Body */}
      <div className="divide-y">
        {vehicles.map((vehicle) => (
          <VehicleRow key={vehicle.id} data={vehicle} />
        ))}
      </div>
    </div>
  );
}

function VehicleRow({ data }: { data: Vehicle }) {
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

  const hasExpired = isExpired(data.sixMonthInspectionDate) || 
                     isExpired(data.registrationExpiryDate) || 
                     isExpired(data.ppAparatExpiryDate);
  
  const hasExpiringSoon = isExpiringSoon(data.sixMonthInspectionDate) || 
                          isExpiringSoon(data.registrationExpiryDate) || 
                          isExpiringSoon(data.ppAparatExpiryDate);

  return (
    <Link href={`/vozila/${data.id}`} className="block hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-6 px-8 py-4">
        {/* Vozilo */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <TruckIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{data.name}</div>
            <div className="text-sm text-muted-foreground font-mono truncate">{data.registrationNumber}</div>
          </div>
        </div>

        {/* Tip */}
        <div className="w-32 flex-shrink-0">
          <span className="text-sm text-muted-foreground">
            {data.vehicleType === "KAMION" ? "Kamion" : "Prikolica"}
          </span>
        </div>

        {/* Status */}
        <div className="w-40 flex-shrink-0">
          {hasExpired ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Isteklo</span>
            </div>
          ) : hasExpiringSoon ? (
            <div className="flex items-center gap-2 text-orange-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Uskoro ističe</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <div className="h-2 w-2 rounded-full bg-green-600"></div>
              <span className="text-sm">Uredno</span>
            </div>
          )}
        </div>

        {/* Ažurirano */}
        <div className="w-40 flex-shrink-0">
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(data.updatedAt), {
              addSuffix: true,
              locale: hr,
            })}
          </span>
        </div>

        {/* Arrow */}
        <div className="w-12 flex-shrink-0 flex justify-end">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}

function VehiclesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <TruckIcon className="h-16 w-16 text-muted-foreground" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">Nema vozila</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Započnite dodavanjem prvog vozila
        </p>
      </div>
    </div>
  );
}

export function VehiclesHeader({ disabled }: { disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between max-w-7xl mx-auto px-8 py-6 border-b w-full">
      <div>
        <h1 className="text-2xl font-bold">Vozila</h1>
      </div>
      <AddVehicleDialog />
    </div>
  );
}

export function VehiclesContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col h-full">{children}</div>;
}

export function VehiclesLoading() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

export function VehiclesError() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-destructive">Greška</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Došlo je do greške pri učitavanju vozila
        </p>
      </div>
    </div>
  );
}
