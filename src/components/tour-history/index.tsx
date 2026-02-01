"use client";

import { useState, useEffect } from "react";
import {
  History,
  SearchIcon,
  Building2,
  MapPin,
  Euro,
  AlertTriangle,
  CalendarDays,
  User,
  Truck,
  Container,
  Eye,
  FileCheck,
  CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { format } from "date-fns";
import { bsLocale } from "@/lib/locale";
import { toast } from "sonner";

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

type HistoryTour = {
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
  isInvoiced: boolean;
  completedAt: string | null;
  driverId: string | null;
  driver: Driver | null;
  truckId: string | null;
  truck: Vehicle | null;
  trailerId: string | null;
  trailer: Vehicle | null;
  createdAt: string;
  updatedAt: string;
};

export function TourHistory() {
  const [tours, setTours] = useState<HistoryTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = () => {
    setLoading(true);
    fetch("/api/contracted-tours")
      .then((res) => res.json())
      .then((data) => {
        // Filter only completed tours
        const completedTours = data.filter((tour: HistoryTour) => tour.isCompleted === true);
        setTours(completedTours);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading tours:", error);
        setLoading(false);
      });
  };

  const handleMarkAsInvoiced = async (tourId: string) => {
    try {
      const response = await fetch(`/api/contracted-tours/${tourId}/invoice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isInvoiced: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to mark as invoiced");
      }

      toast.success("Tura je označena kao fakturisana");
      fetchTours();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri označavanju ture");
    }
  };

  const handleUnmarkAsInvoiced = async (tourId: string) => {
    try {
      const response = await fetch(`/api/contracted-tours/${tourId}/invoice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isInvoiced: false }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to unmark as invoiced");
      }

      toast.success("Tura je označena kao nefakturisana");
      fetchTours();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri označavanju ture");
    }
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

  const nefakturisaneTours = filteredTours.filter((t) => !t.isInvoiced);
  const fakturisaneTours = filteredTours.filter((t) => t.isInvoiced);

  if (loading) {
    return <TourHistoryLoading />;
  }

  if (tours.length === 0) {
    return <TourHistoryEmpty />;
  }

  return (
    <div className="flex flex-col w-full">
      {/* Search Bar */}
      <div className="px-8 py-4 border-b">
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Pretraži historiju..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="nefakturisane" className="w-full">
        <div className="px-8 pt-4">
          <TabsList>
            <TabsTrigger value="nefakturisane">
              Nefakturisane ({nefakturisaneTours.length})
            </TabsTrigger>
            <TabsTrigger value="fakturisane">
              Fakturisane ({fakturisaneTours.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="nefakturisane" className="mt-0">
          <TourTable
            tours={nefakturisaneTours}
            searchQuery={searchQuery}
            showInvoiceButton={true}
            onMarkAsInvoiced={handleMarkAsInvoiced}
          />
        </TabsContent>

        <TabsContent value="fakturisane" className="mt-0">
          <TourTable
            tours={fakturisaneTours}
            searchQuery={searchQuery}
            showInvoiceButton={false}
            onUnmarkAsInvoiced={handleUnmarkAsInvoiced}
          />
        </TabsContent>
      </Tabs>
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
  searchQuery,
  showInvoiceButton,
  onMarkAsInvoiced,
  onUnmarkAsInvoiced,
}: {
  tours: HistoryTour[];
  searchQuery: string;
  showInvoiceButton: boolean;
  onMarkAsInvoiced?: (id: string) => void;
  onUnmarkAsInvoiced?: (id: string) => void;
}) {
  const ITEMS_PER_PAGE = 40;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when tours change
  useEffect(() => {
    setCurrentPage(1);
  }, [tours.length, searchQuery]);

  if (tours.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <SearchIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>{searchQuery ? "Nema rezultata pretrage" : "Nema tura u ovoj kategoriji"}</p>
      </div>
    );
  }

  // Grid columns: Tip | Kompanija | Kamion | Prikolica | Vozač | Utovar | Istovar | Cijena | ADR | Završeno | Akcije
  const gridCols = "grid-cols-[60px_1fr_130px_130px_140px_1fr_1fr_100px_60px_100px_120px]";

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
        <div className="flex items-center">Istovar</div>
        <div className="flex items-center justify-center">Cijena</div>
        <div className="flex items-center justify-center">ADR</div>
        <div className="flex items-center justify-center">Završeno</div>
        <div></div>
      </div>

      {/* Table Body */}
      <div className="divide-y">
        {paginatedTours.map((tour) => (
          <TourRow 
            key={tour.id} 
            tour={tour} 
            gridCols={gridCols}
            showInvoiceButton={showInvoiceButton}
            onMarkAsInvoiced={onMarkAsInvoiced}
            onUnmarkAsInvoiced={onUnmarkAsInvoiced}
          />
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
  gridCols,
  showInvoiceButton,
  onMarkAsInvoiced,
  onUnmarkAsInvoiced,
}: {
  tour: HistoryTour;
  gridCols: string;
  showInvoiceButton: boolean;
  onMarkAsInvoiced?: (id: string) => void;
  onUnmarkAsInvoiced?: (id: string) => void;
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
        {tour.truck ? (
          <div className="flex items-center gap-1.5 text-xs">
            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{tour.truck.registrationNumber}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </div>

      {/* Prikolica */}
      <div className="flex items-center justify-center">
        {tour.trailer ? (
          <div className="flex items-center gap-1.5 text-xs">
            <Container className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{tour.trailer.registrationNumber}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </div>

      {/* Vozač */}
      <div className="flex items-center justify-center">
        {tour.driver ? (
          <div className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded">
            <User className="h-3.5 w-3.5" />
            <span className="truncate max-w-[100px]">{tour.driver.name}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
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

      {/* Završeno */}
      <div className="flex items-center justify-center">
        <span className="text-xs text-muted-foreground">
          {formatDate(tour.completedAt)}
        </span>
      </div>

      {/* Akcije */}
      <div className="flex items-center justify-center">
        {showInvoiceButton ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => onMarkAsInvoiced?.(tour.id)}
          >
            <FileCheck className="h-3.5 w-3.5" />
            Fakturiši
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-green-600"
            onClick={() => onUnmarkAsInvoiced?.(tour.id)}
            title="Klikni da ukloniš oznaku fakturisano"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Fakturisano
          </Button>
        )}
      </div>
    </div>
  );
}

function TourHistoryEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <History className="h-16 w-16 text-muted-foreground" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">Nema završenih tura</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Završene ture će se pojaviti ovdje
        </p>
      </div>
    </div>
  );
}

export function TourHistoryHeader() {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b w-full">
      <div>
        <h1 className="text-2xl font-bold">Historija tura</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Završene i fakturisane ture
        </p>
      </div>
    </div>
  );
}

export function TourHistoryContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col h-full">{children}</div>;
}

export function TourHistoryLoading() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}
