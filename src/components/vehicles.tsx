"use client";

import { formatDistanceToNow, format } from "date-fns";
import { bsLocale } from "@/lib/locale";
import { TruckIcon, CalendarIcon, AlertCircle, ChevronRight, SearchIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AddVehicleDialog } from "@/components/add-vehicle-dialog";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";

const ITEMS_PER_PAGE = 40;

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
  isAvailable?: boolean;
};

export function VehiclesList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("all");

  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: ITEMS_PER_PAGE.toString(),
      ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
    });

    if (!initialLoadDone) {
      setLoading(true);
    } else {
      setIsSearching(true);
    }
    
    fetch(`/api/vehicles?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setVehicles(data.vehicles || []);
        setTotalItems(data.pagination?.total || 0);
        setLoading(false);
        setIsSearching(false);
        setInitialLoadDone(true);
      })
      .catch((error) => {
        console.error("Error loading vehicles:", error);
        setLoading(false);
        setIsSearching(false);
      });
  }, [currentPage, debouncedSearchQuery, refreshKey]);

  if (loading) {
    return <VehiclesLoading />;
  }

  const isEmpty = vehicles.length === 0 && !debouncedSearchQuery;

  // Filter vehicles based on active tab
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (activeTab === "available") {
      return vehicle.vehicleType === "KAMION" && vehicle.isAvailable;
    }
    return true; // "all" tab shows everything
  });

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto">{/*Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b w-full">
        <div>
          <h1 className="text-2xl font-bold">Vozila</h1>
        </div>
        <AddVehicleDialog onSuccess={triggerRefresh} />
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <TruckIcon className="h-16 w-16 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Nema vozila</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Započnite dodavanjem prvog vozila
            </p>
          </div>
        </div>
      ) : (
        <>
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-8 pt-4">
          <TabsList>
            <TabsTrigger value="all">Svi</TabsTrigger>
            <TabsTrigger value="available">Slobodni kamioni</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          {/* Search Bar */}
          <div className="px-8 py-4 border-b">
            <div className="relative max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Pretraži vozila..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          </div>

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
            {filteredVehicles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <SearchIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Nema rezultata pretrage</p>
              </div>
            ) : (
              filteredVehicles.map((vehicle) => (
                <VehicleRow key={vehicle.id} data={vehicle} />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </TabsContent>

        <TabsContent value="available" className="mt-0">
          {/* Search Bar */}
          <div className="px-8 py-4 border-b">
            <div className="relative max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Pretraži vozila..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          </div>

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
            {filteredVehicles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <TruckIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>Nema slobodnih kamiona</p>
              </div>
            ) : (
              filteredVehicles.map((vehicle) => (
                <VehicleRow key={vehicle.id} data={vehicle} />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </TabsContent>
      </Tabs>
        </>
      )}
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
            {data.vehicleType === "PRIKOLICA" ? (
              <Image src="/semi-trailer.png" alt="Prikolica" width={20} height={20} className="h-5 w-5" />
            ) : (
              <TruckIcon className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate flex items-center gap-2">
              {data.name}
              {data.isAvailable && data.vehicleType === "KAMION" && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Slobodan
                </span>
              )}
            </div>
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
