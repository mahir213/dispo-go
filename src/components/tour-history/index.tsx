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
  Edit2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
  invoiceNumber: string | null;
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
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeTab, setActiveTab] = useState("nefakturisane");
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogMode, setDialogMode] = useState<"invoice" | "edit">("invoice");
  const ITEMS_PER_PAGE = 40;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchTours();
  }, [currentPage, debouncedSearchQuery]);

  const fetchTours = () => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: ITEMS_PER_PAGE.toString(),
      filterCompleted: "true",
      ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
    });

    if (!initialLoadDone) {
      setLoading(true);
    } else {
      setIsSearching(true);
    }
    
    fetch(`/api/contracted-tours?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setTours(data.tours || []);
        setTotalItems(data.pagination?.total || 0);
        setLoading(false);
        setIsSearching(false);
        setInitialLoadDone(true);
      })
      .catch((error) => {
        console.error("Error loading tours:", error);
        setLoading(false);
        setIsSearching(false);
      });
  };

  const handleMarkAsInvoiced = async (tourId: string, currentInvoiceNumber?: string | null) => {
    setSelectedTourId(tourId);
    setInvoiceNumber(currentInvoiceNumber || "");
    setDialogMode("invoice");
    setInvoiceDialogOpen(true);
  };

  const handleConfirmInvoice = async () => {
    if (!selectedTourId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/contracted-tours/${selectedTourId}/invoice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          isInvoiced: true,
          invoiceNumber: invoiceNumber.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to mark as invoiced");
      }

      toast.success("Tura je označena kao fakturisana");
      setInvoiceDialogOpen(false);
      setInvoiceNumber("");
      setSelectedTourId(null);
      fetchTours();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri označavanju ture");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInvoiceNumber = async (tourId: string, currentInvoiceNumber?: string | null) => {
    setSelectedTourId(tourId);
    setInvoiceNumber(currentInvoiceNumber || "");
    setDialogMode("edit");
    setInvoiceDialogOpen(true);
  };

  const handleConfirmUpdateInvoiceNumber = async () => {
    if (!selectedTourId) return;

    setIsSubmitting(true);
    try {
      const currentTour = tours.find(t => t.id === selectedTourId);
      const response = await fetch(`/api/contracted-tours/${selectedTourId}/invoice`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          isInvoiced: currentTour?.isInvoiced || false,
          invoiceNumber: invoiceNumber.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update invoice number");
      }

      toast.success("Broj računa je ažuriran");
      setInvoiceDialogOpen(false);
      setInvoiceNumber("");
      setSelectedTourId(null);
      fetchTours();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri ažuriranju broja računa");
    } finally {
      setIsSubmitting(false);
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

  if (loading) {
    return <TourHistoryLoading />;
  }

  if (tours.length === 0 && !debouncedSearchQuery) {
    return <TourHistoryEmpty />;
  }

  const nefakturisaneTours = tours.filter((t) => !t.isInvoiced);
  const fakturisaneTours = tours.filter((t) => t.isInvoiced);

  return (
    <div className="flex flex-col w-full -ml-12">
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
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            onUpdateInvoiceNumber={handleUpdateInvoiceNumber}
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </TabsContent>

        <TabsContent value="fakturisane" className="mt-0">
          <TourTable
            tours={fakturisaneTours}
            searchQuery={searchQuery}
            showInvoiceButton={false}
            onUnmarkAsInvoiced={handleUnmarkAsInvoiced}
            onUpdateInvoiceNumber={handleUpdateInvoiceNumber}
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </TabsContent>
      </Tabs>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "invoice" ? "Fakturisanje ture" : "Ažuriranje broja računa"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "invoice" 
                ? "Unesite broj računa za ovu turu (opciono)"
                : "Promijenite broj računa za ovu turu"
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="invoiceNumber">Broj računa</Label>
              <Input
                id="invoiceNumber"
                placeholder="npr. 2024/001"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSubmitting) {
                    dialogMode === "invoice" ? handleConfirmInvoice() : handleConfirmUpdateInvoiceNumber();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInvoiceDialogOpen(false)}
              disabled={isSubmitting}
            >
              Otkaži
            </Button>
            <Button 
              onClick={() => dialogMode === "invoice" ? handleConfirmInvoice() : handleConfirmUpdateInvoiceNumber()} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Čuvam..." : dialogMode === "invoice" ? "Fakturiši" : "Sačuvaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  onUpdateInvoiceNumber,
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  tours: HistoryTour[];
  searchQuery: string;
  showInvoiceButton: boolean;
  onMarkAsInvoiced?: (id: string, currentInvoiceNumber?: string | null) => void;
  onUnmarkAsInvoiced?: (id: string) => void;
  onUpdateInvoiceNumber?: (id: string, currentInvoiceNumber?: string | null) => void;
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
  if (tours.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <SearchIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>{searchQuery ? "Nema rezultata pretrage" : "Nema tura u ovoj kategoriji"}</p>
      </div>
    );
  }

  // Grid columns: Tip | Kompanija | Kamion | Prikolica | Vozač | Utovar | Istovar | Cijena | ADR | Završeno | Broj računa | Akcije
  const gridCols = "grid-cols-[70px_180px_120px_120px_140px_minmax(200px,1fr)_minmax(200px,1fr)_110px_70px_110px_120px_130px]";

  return (
    <>
      {/* Table Header */}
      <div className={`grid ${gridCols} gap-2.5 px-3 py-3 bg-muted/50 border-y text-xs font-medium text-muted-foreground`}>
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
        <div className="flex items-center justify-center">Br. računa</div>
        <div></div>
      </div>

      {/* Table Body */}
      <div className="divide-y">
        {tours.map((tour) => (
          <TourRow 
            key={tour.id} 
            tour={tour} 
            gridCols={gridCols}
            showInvoiceButton={showInvoiceButton}
            onMarkAsInvoiced={onMarkAsInvoiced}
            onUnmarkAsInvoiced={onUnmarkAsInvoiced}
            onUpdateInvoiceNumber={onUpdateInvoiceNumber}
          />
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
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
  onUpdateInvoiceNumber,
}: {
  tour: HistoryTour;
  gridCols: string;
  showInvoiceButton: boolean;
  onMarkAsInvoiced?: (id: string, currentInvoiceNumber?: string | null) => void;
  onUnmarkAsInvoiced?: (id: string) => void;
  onUpdateInvoiceNumber?: (id: string, currentInvoiceNumber?: string | null) => void;
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

  const truncateText = (text: string, maxLength: number = 15) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className={`grid ${gridCols} gap-2.5 px-3 py-3 hover:bg-muted/30 transition-colors items-center`}>
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
      <div className="flex items-center gap-1.5 min-w-0">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-medium text-sm truncate" title={tour.company}>{truncateText(tour.company)}</span>
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
            {truncateText(tour.loadingLocation)}
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
                  {truncateText(stop.location)}
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

      {/* Broj računa */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => onUpdateInvoiceNumber?.(tour.id, tour.invoiceNumber)}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted/50 transition-colors group"
          title="Klikni da izmijeniš broj računa"
        >
          {tour.invoiceNumber ? (
            <>
              <span className="text-xs font-medium">{tour.invoiceNumber}</span>
              <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          ) : (
            <>
              <span className="text-xs text-muted-foreground">-</span>
              <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </button>
      </div>

      {/* Akcije */}
      <div className="flex items-center justify-center">
        {showInvoiceButton ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => onMarkAsInvoiced?.(tour.id, tour.invoiceNumber)}
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
