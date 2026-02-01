"use client";

import { useState, useEffect } from "react";
import {
  Route,
  Truck,
  SearchIcon,
  Building2,
  MapPin,
  Euro,
  AlertTriangle,
  MoreVertical,
  Pencil,
  Trash2,
  CalendarDays,
  User,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { EditContractedTourDialog } from "@/components/contracted-tours/edit-contracted-tour-dialog";
import { DeleteContractedTourDialog } from "@/components/contracted-tours/delete-contracted-tour-dialog";
import { AssignDriver } from "@/components/contracted-tours/assign-driver";
import { AssignVehicle } from "@/components/contracted-tours/assign-vehicle";
import { format } from "date-fns";
import { bsLocale } from "@/lib/locale";

type UnloadingStop = {
  id: string;
  location: string;
  unloadingDate: string | null;
};

type Driver = {
  id: string;
  name: string;
  phoneNumber: string;
};

type Vehicle = {
  id: string;
  name: string;
  registrationNumber: string;
  vehicleType: "KAMION" | "PRIKOLICA";
};

type ActiveTour = {
  id: string;
  tourType: "UVOZ" | "IZVOZ" | "MEDJUTURA";
  loadingLocation: string;
  loadingDate: string | null;
  exportCustoms: string | null;
  importCustoms: string | null;
  unloadingStops: UnloadingStop[];
  price: number;
  company: string;
  isADR: boolean;
  isCompleted: boolean;
  driverId: string | null;
  driver: Driver | null;
  truckId: string | null;
  truck: Vehicle | null;
  trailerId: string | null;
  trailer: Vehicle | null;
  createdAt: string;
  updatedAt: string;
};

export function ActiveToursList() {
  const [tours, setTours] = useState<ActiveTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editTour, setEditTour] = useState<ActiveTour | null>(null);
  const [deleteTour, setDeleteTour] = useState<ActiveTour | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);

  const fetchTours = () => {
    setLoading(true);
    fetch("/api/contracted-tours")
      .then((res) => res.json())
      .then((data) => {
        // Filter only active tours (with driver assigned and not completed)
        const activeTours = data.filter((tour: ActiveTour) => 
          tour.driverId !== null && tour.isCompleted !== true
        );
        setTours(activeTours);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading tours:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTours();
  }, []);

  const handleCompleteTour = async (tourId: string) => {
    try {
      const response = await fetch(`/api/contracted-tours/${tourId}/complete`, {
        method: "PUT",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to complete tour");
      }

      toast.success("Tura je završena i prebačena u historiju");
      fetchTours();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri završavanju ture");
    }
  };

  // Helper function to get the last unloading date from a tour
  const getLastUnloadingDate = (tour: ActiveTour): Date | null => {
    if (!tour.unloadingStops || tour.unloadingStops.length === 0) return null;
    const lastStop = tour.unloadingStops[tour.unloadingStops.length - 1];
    return lastStop.unloadingDate ? new Date(lastStop.unloadingDate) : null;
  };

  // Sort function
  const sortTours = (toursToSort: ActiveTour[]): ActiveTour[] => {
    if (!sortOrder) return toursToSort;
    
    return [...toursToSort].sort((a, b) => {
      const dateA = getLastUnloadingDate(a);
      const dateB = getLastUnloadingDate(b);
      
      // Handle null dates - put them at the end
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      const comparison = dateA.getTime() - dateB.getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const filteredTours = tours.filter((tour) => {
    const query = searchQuery.toLowerCase();
    const unloadingLocations = tour.unloadingStops?.map(s => s.location.toLowerCase()).join(" ") || "";
    const driverName = tour.driver?.name.toLowerCase() || "";
    return (
      tour.company.toLowerCase().includes(query) ||
      tour.loadingLocation.toLowerCase().includes(query) ||
      unloadingLocations.includes(query) ||
      driverName.includes(query) ||
      (tour.exportCustoms?.toLowerCase().includes(query) ?? false) ||
      (tour.importCustoms?.toLowerCase().includes(query) ?? false)
    );
  });

  const sortedFilteredTours = sortTours(filteredTours);
  const uvozTours = sortTours(filteredTours.filter((t) => t.tourType === "UVOZ"));
  const izvozTours = sortTours(filteredTours.filter((t) => t.tourType === "IZVOZ"));
  const medjuturaTours = sortTours(filteredTours.filter((t) => t.tourType === "MEDJUTURA"));

  if (loading) {
    return <ActiveToursLoading />;
  }

  if (tours.length === 0) {
    return <ActiveToursEmpty />;
  }

  return (
    <div className="flex flex-col w-full">
      {/* Search Bar */}
      <div className="px-8 py-4 border-b">
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Pretraži aktivne ture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sve" className="w-full">
        <div className="px-8 pt-4">
          <TabsList>
            <TabsTrigger value="sve">
              Sve ({filteredTours.length})
            </TabsTrigger>
            <TabsTrigger value="uvoz">
              Uvoz ({uvozTours.length})
            </TabsTrigger>
            <TabsTrigger value="izvoz">
              Izvoz ({izvozTours.length})
            </TabsTrigger>
            <TabsTrigger value="medjutura">
              Međ. ({medjuturaTours.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sve" className="mt-0">
          <TourTable
            tours={sortedFilteredTours}
            onEdit={setEditTour}
            onDelete={setDeleteTour}
            onComplete={handleCompleteTour}
            searchQuery={searchQuery}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
          />
        </TabsContent>

        <TabsContent value="uvoz" className="mt-0">
          <TourTable
            tours={uvozTours}
            onEdit={setEditTour}
            onDelete={setDeleteTour}
            onComplete={handleCompleteTour}
            searchQuery={searchQuery}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
          />
        </TabsContent>

        <TabsContent value="izvoz" className="mt-0">
          <TourTable
            tours={izvozTours}
            onEdit={setEditTour}
            onDelete={setDeleteTour}
            onComplete={handleCompleteTour}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            searchQuery={searchQuery}
          />
        </TabsContent>

        <TabsContent value="medjutura" className="mt-0">
          <TourTable
            tours={medjuturaTours}
            onEdit={setEditTour}
            onDelete={setDeleteTour}
            onComplete={handleCompleteTour}
            searchQuery={searchQuery}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editTour && (
        <EditContractedTourDialog
          tour={editTour}
          open={!!editTour}
          onOpenChange={(open) => !open && setEditTour(null)}
        />
      )}

      {/* Delete Dialog */}
      {deleteTour && (
        <DeleteContractedTourDialog
          tourId={deleteTour.id}
          tourName={`${deleteTour.company} - ${deleteTour.loadingLocation} → ${deleteTour.unloadingStops?.[0]?.location || "?"}`}
          open={!!deleteTour}
          onOpenChange={(open) => !open && setDeleteTour(null)}
        />
      )}
    </div>
  );
}

function PriceCell({ price }: { price: number | string }) {
  const [showPrice, setShowPrice] = useState(false);
  
  const formattedPrice = Number(price).toLocaleString("hr-HR", { minimumFractionDigits: 0 });
  
  return (
    <div className="flex items-center justify-center gap-1.5">
      <div className="flex items-center gap-1 font-medium text-sm">
        <Euro className="h-3.5 w-3.5 shrink-0" />
        <span className="tabular-nums">
          {showPrice ? formattedPrice : "•••••"}
        </span>
      </div>
      <button
        type="button"
        className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        onMouseDown={() => setShowPrice(true)}
        onMouseUp={() => setShowPrice(false)}
        onMouseLeave={() => setShowPrice(false)}
        onTouchStart={() => setShowPrice(true)}
        onTouchEnd={() => setShowPrice(false)}
        title="Drži za prikaz cijene"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function TourTable({
  tours,
  onEdit,
  onDelete,
  onComplete,
  searchQuery,
  sortOrder,
  onSortChange,
}: {
  tours: ActiveTour[];
  onEdit: (tour: ActiveTour) => void;
  onDelete: (tour: ActiveTour) => void;
  onComplete: (tourId: string) => void;
  searchQuery: string;
  sortOrder: "asc" | "desc" | null;
  onSortChange: (order: "asc" | "desc" | null) => void;
}) {
  const ITEMS_PER_PAGE = 40;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when tours change
  useEffect(() => {
    setCurrentPage(1);
  }, [tours.length, searchQuery]);

  const handleSortClick = () => {
    if (sortOrder === null) {
      onSortChange("asc");
    } else if (sortOrder === "asc") {
      onSortChange("desc");
    } else {
      onSortChange(null);
    }
  };

  const SortIcon = sortOrder === "asc" ? ArrowUp : sortOrder === "desc" ? ArrowDown : ArrowUpDown;

  if (tours.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <SearchIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>{searchQuery ? "Nema rezultata pretrage" : "Nema tura u ovoj kategoriji"}</p>
      </div>
    );
  }

  // Grid columns: Tip | Kompanija | Kamion | Prikolica | Vozač | Utovar | Istovar | Carine | Cijena | ADR | Završi | Akcije
  const gridCols = "grid-cols-[60px_1fr_130px_130px_140px_1fr_1fr_90px_80px_60px_90px_48px]";

  // Paginated tours
  const paginatedTours = tours.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      {/* Table Header */}
      <div className={`grid ${gridCols} gap-4 px-4 py-3 bg-muted/50 border-y text-xs font-medium text-muted-foreground`}>
        <div className="flex items-center justify-center">Tip</div>
        <div className="flex items-center">Kompanija</div>
        <div className="flex items-center justify-center">Kamion</div>
        <div className="flex items-center justify-center">Prikolica</div>
        <div className="flex items-center justify-center">Vozač</div>
        <div className="flex items-center">Utovar</div>
        <button 
          onClick={handleSortClick}
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
          title="Sortiraj po datumu istovara"
        >
          Istovar
          <SortIcon className={`h-3.5 w-3.5 ${sortOrder ? 'text-foreground' : ''}`} />
        </button>
        <div className="flex items-center justify-center">Carine</div>
        <div className="flex items-center justify-center">Cijena</div>
        <div className="flex items-center justify-center">ADR</div>
        <div></div>
        <div></div>
      </div>

      {/* Table Body */}
      <div className="divide-y">
        {paginatedTours.map((tour) => (
          <TourRow key={tour.id} tour={tour} onEdit={onEdit} onDelete={onDelete} onComplete={onComplete} gridCols={gridCols} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={tours.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />
    </>
  );
}

function TourRow({
  tour,
  onEdit,
  onDelete,
  onComplete,
  gridCols,
}: {
  tour: ActiveTour;
  onEdit: (tour: ActiveTour) => void;
  onDelete: (tour: ActiveTour) => void;
  onComplete: (tourId: string) => void;
  gridCols: string;
}) {
  const getTourTypeLabel = (type: string) => {
    switch (type) {
      case "UVOZ":
        return "Uvoz";
      case "IZVOZ":
        return "Izvoz";
      case "MEDJUTURA":
        return "Međ.";
      default:
        return type;
    }
  };

  const getTourTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "UVOZ":
        return "default";
      case "IZVOZ":
        return "secondary";
      case "MEDJUTURA":
        return "outline";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd.MM.yy", { locale: bsLocale });
  };

  return (
    <div className={`grid ${gridCols} gap-4 px-4 py-3 hover:bg-muted/30 transition-colors items-center`}>
      {/* Tip */}
      <div className="flex items-center justify-center">
        <Badge 
          variant={getTourTypeBadgeVariant(tour.tourType) as "default" | "secondary" | "outline"}
          className="text-xs whitespace-nowrap"
        >
          {getTourTypeLabel(tour.tourType)}
        </Badge>
      </div>

      {/* Kompanija */}
      <div className="flex items-center gap-2 min-w-0">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-medium text-sm truncate">{tour.company}</span>
      </div>

      {/* Kamion */}
      <div className="flex items-center justify-center">
        <AssignVehicle tourId={tour.id} vehicleType="KAMION" currentVehicle={tour.truck} />
      </div>

      {/* Prikolica */}
      <div className="flex items-center justify-center">
        <AssignVehicle tourId={tour.id} vehicleType="PRIKOLICA" currentVehicle={tour.trailer} />
      </div>

      {/* Vozač */}
      <div className="flex items-center justify-center">
        <AssignDriver tourId={tour.id} currentDriver={tour.driver} />
      </div>

      {/* Utovar */}
      <div className="flex flex-col justify-center gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5 text-sm">
          <MapPin className="h-3.5 w-3.5 text-green-600 shrink-0" />
          <span className="truncate" title={tour.loadingLocation}>
            {tour.loadingLocation}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span>{formatDate(tour.loadingDate)}</span>
        </div>
      </div>

      {/* Istovar */}
      <div className="flex flex-col justify-center gap-1 min-w-0">
        {tour.unloadingStops && tour.unloadingStops.length > 0 ? (
          tour.unloadingStops.map((stop, idx) => (
            <div key={stop.id || idx} className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-sm">
                <MapPin className="h-3.5 w-3.5 text-red-600 shrink-0" />
                <span className="truncate" title={stop.location}>
                  {stop.location}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="h-3 w-3 shrink-0" />
                <span>{formatDate(stop.unloadingDate)}</span>
              </div>
            </div>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </div>

      {/* Carine */}
      <div className="flex flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground">
        <div className="truncate" title={`Izv: ${tour.exportCustoms || '-'}`}>
          Izv: {tour.exportCustoms || '-'}
        </div>
        <div className="truncate" title={`Uv: ${tour.importCustoms || '-'}`}>
          Uv: {tour.importCustoms || '-'}
        </div>
      </div>

      {/* Cijena */}
      <PriceCell price={tour.price} />

      {/* ADR */}
      <div className="flex items-center justify-center">
        {tour.isADR ? (
          <Badge variant="destructive" className="text-xs gap-0.5">
            <AlertTriangle className="h-3 w-3" />
            ADR
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </div>

      {/* Završi */}
      <div className="flex items-center justify-center">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
          onClick={() => onComplete(tour.id)}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Završi
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(tour)}>
              <Pencil className="h-4 w-4 mr-2" />
              Uredi
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(tour)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Obriši
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function ActiveToursEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Truck className="h-16 w-16 text-muted-foreground" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">Nema aktivnih tura</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Dodijelite vozača ugovorenoj turi da bi postala aktivna
        </p>
      </div>
    </div>
  );
}

export function ActiveToursHeader() {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b w-full">
      <div>
        <h1 className="text-2xl font-bold">Aktivne ture</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ture s dodijeljenim vozačem
        </p>
      </div>
    </div>
  );
}

export function ActiveToursContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col h-full">{children}</div>;
}

export function ActiveToursLoading() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
