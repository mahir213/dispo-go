"use client";

import { formatDistanceToNow } from "date-fns";
import { bsLocale } from "@/lib/locale";
import { UserIcon, CalendarIcon, PlusIcon, AlertCircle, ChevronRight, SearchIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AddDriverDialog } from "@/components/add-driver-dialog";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { useEffect, useState } from "react";

const ITEMS_PER_PAGE = 40;

type DriverNote = {
  id: string;
  content: string;
  noteType: "POSITIVE" | "NEGATIVE";
  createdAt: string;
};

type Driver = {
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
};

export function DriversList() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch("/api/drivers")
      .then((res) => res.json())
      .then((data) => {
        setDrivers(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading drivers:", error);
        setLoading(false);
      });
  }, []);

  const filteredDrivers = drivers.filter((driver) => {
    const query = searchQuery.toLowerCase();
    return (
      driver.name.toLowerCase().includes(query) ||
      driver.phoneNumber.toLowerCase().includes(query) ||
      driver.licenseNumber.toLowerCase().includes(query) ||
      (driver.email && driver.email.toLowerCase().includes(query))
    );
  });

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Paginated drivers
  const paginatedDrivers = filteredDrivers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return <DriversLoading />;
  }

  if (drivers.length === 0) {
    return <DriversEmpty />;
  }

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto">
      {/* Search Bar */}
      <div className="px-8 py-4 border-b">
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Pretraži vozače..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center gap-6 px-8 py-4 bg-muted/50 border-y text-sm font-medium text-muted-foreground">
        <div className="flex-1 min-w-0">Vozač</div>
        <div className="w-32 flex-shrink-0">Telefon</div>
        <div className="w-40 flex-shrink-0">Status</div>
        <div className="w-40 flex-shrink-0">Ažurirano</div>
        <div className="w-12 flex-shrink-0" aria-label="Actions"></div>
      </div>
      
      {/* Table Body */}
      <div className="divide-y">
        {filteredDrivers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <SearchIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nema rezultata pretrage</p>
          </div>
        ) : (
          paginatedDrivers.map((driver) => (
            <DriverRow key={driver.id} data={driver} />
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredDrivers.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

function DriverRow({ data }: { data: Driver }) {
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

  const hasExpired = isExpired(data.licenseExpiryDate) || 
                     isExpired(data.medicalExamExpiryDate) || 
                     isExpired(data.driverCardExpiryDate);
  
  const hasExpiringSoon = isExpiringSoon(data.licenseExpiryDate) || 
                          isExpiringSoon(data.medicalExamExpiryDate) || 
                          isExpiringSoon(data.driverCardExpiryDate);

  return (
    <Link href={`/vozaci/${data.id}`} className="block hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-6 px-8 py-4">
        {/* Vozač */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <UserIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{data.name}</div>
            <div className="text-sm text-muted-foreground font-mono truncate">{data.licenseNumber}</div>
          </div>
        </div>

        {/* Telefon */}
        <div className="w-32 flex-shrink-0">
          <span className="text-sm text-muted-foreground truncate block">
            {data.phoneNumber}
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
              locale: bsLocale,
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

function DriversEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <UserIcon className="h-16 w-16 text-muted-foreground" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">Nema vozača</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Započnite dodavanjem prvog vozača
        </p>
      </div>
    </div>
  );
}

export function DriversHeader() {
  return (
    <div className="flex items-center justify-between max-w-7xl mx-auto px-8 py-6 border-b w-full">
      <div>
        <h1 className="text-2xl font-bold">Vozači</h1>
      </div>
      <AddDriverDialog />
    </div>
  );
}

export function DriversContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col h-full">{children}</div>;
}

export function DriversLoading() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

export function DriversError() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-destructive">Greška</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Došlo je do greške pri učitavanju vozača
        </p>
      </div>
    </div>
  );
}
