"use client";

import { useState, useEffect, useRef } from "react";
import {
  History,
  SearchIcon,
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
  ChevronDown,
  ChevronRight,
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
import { AssignVehicleHistory } from "./assign-vehicle-history";
import { AssignDriverHistory } from "./assign-driver-history";
import { EditCompanyInline } from "./edit-company-inline";

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [tabTotals, setTabTotals] = useState<Record<string, number>>({});
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState("nefakturisane");
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const totalsCacheRef = useRef<{ query: string; timestamp: number; totals: Record<string, number> } | null>(null);
  const TOTALS_CACHE_TTL_MS = 30 * 1000;
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedTourId, setSelectedTourId] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogMode, setDialogMode] = useState<"invoice" | "edit">("invoice");
  const INITIAL_ITEMS = 50;
  const LOAD_MORE_ITEMS = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
      setHasMore(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchTours();
  }, [currentPage, debouncedSearchQuery, activeTab]);

  useEffect(() => {
    fetchTabTotals();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    setCurrentPage(1);
    setTours([]);
    setHasMore(true);
  }, [activeTab]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  const fetchTours = (isLoadingMore = false) => {
    const limit = currentPage === 1 ? INITIAL_ITEMS : LOAD_MORE_ITEMS;
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: limit.toString(),
      filterCompleted: "true",
      ...(activeTab === "nefakturisane" ? { filterInvoiced: "false" } : { filterInvoiced: "true" }),
      ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
    });

    if (!initialLoadDone && !isLoadingMore) {
      setLoading(true);
    } else if (isLoadingMore) {
      setLoadingMore(true);
    } else {
      setIsSearching(true);
    }
    
    fetch(`/api/contracted-tours?${params}`)
      .then((res) => res.json())
      .then((data) => {
        const newTours = data.tours || [];
        const total = data.pagination?.total || 0;
        const mergeToursUnique = (existing: HistoryTour[], incoming: HistoryTour[]) => {
          const map = new Map<string, HistoryTour>();
          for (const t of existing) map.set(t.id, t);
          for (const t of incoming) map.set(t.id, t);
          return Array.from(map.values());
        };

        if (isLoadingMore || currentPage > 1) {
          setTours((prev) => {
            const next = mergeToursUnique(prev, newTours);
            setHasMore(newTours.length === limit && next.length < total);
            return next;
          });
        } else {
          // Replace but ensure uniqueness just in case
          const unique = mergeToursUnique([], newTours);
          setTours(unique);
          setHasMore(unique.length === limit && unique.length < total);
        }
        setTotalItems(total);
        setLoading(false);
        setLoadingMore(false);
        setIsSearching(false);
        setInitialLoadDone(true);
      })
      .catch((error) => {
        console.error("Error loading tours:", error);
        setLoading(false);
        setLoadingMore(false);
        setIsSearching(false);
      });
  };

  const fetchTabTotals = () => {
    const cached = totalsCacheRef.current;
    if (cached && cached.query === debouncedSearchQuery) {
      const isFresh = Date.now() - cached.timestamp < TOTALS_CACHE_TTL_MS;
      if (isFresh) {
        setTabTotals(cached.totals);
        return;
      }
    }

    const tabConfigs = [
      { key: "nefakturisane", filterInvoiced: "false" },
      { key: "fakturisane", filterInvoiced: "true" },
    ];

    Promise.all(
      tabConfigs.map((tab) => {
        const params = new URLSearchParams({
          page: "1",
          limit: "1",
          filterCompleted: "true",
          filterInvoiced: tab.filterInvoiced,
          ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
        });

        return fetch(`/api/contracted-tours?${params}`)
          .then((res) => res.json())
          .then((data) => ({ key: tab.key, total: data.pagination?.total || 0 }))
          .catch(() => ({ key: tab.key, total: 0 }));
      })
    ).then((results) => {
      const totals = results.reduce<Record<string, number>>((acc, result) => {
        acc[result.key] = result.total;
        return acc;
      }, {});
      totalsCacheRef.current = {
        query: debouncedSearchQuery,
        timestamp: Date.now(),
        totals,
      };
      setTabTotals(totals);
    });
  };

  const handleLoadMore = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => {
      if (prev) {
        setSelectedIds(new Set());
      }
      return !prev;
    });
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = (ids: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        ids.forEach((id) => next.add(id));
      } else {
        ids.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const shouldDelete = window.confirm("Obrisati odabrane ture?");
    if (!shouldDelete) return;

    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        const response = await fetch(`/api/contracted-tours/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Greška pri brisanju ture");
        }
      }
      toast.success("Odabrane ture su obrisane");
      setSelectedIds(new Set());
      setCurrentPage(1);
      setTours([]);
      setHasMore(true);
      fetchTours();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri brisanju tura");
    }
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

  const nefakturisaneTours = activeTab === "nefakturisane" ? tours : [];
  const fakturisaneTours = activeTab === "fakturisane" ? tours : [];

  return (
    <div className="flex flex-col w-full -ml-12">
      {/* Search Bar */}
      <div className="px-8 py-4 border-b flex items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
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
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={toggleSelectionMode}>
            {selectionMode ? "Završi" : "Označi"}
          </Button>
          {selectionMode && (
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0}
            >
              Obriši ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-8 pt-4">
          <TabsList>
            <TabsTrigger value="nefakturisane">
              Nefakturisane ({tabTotals.nefakturisane || 0})
            </TabsTrigger>
            <TabsTrigger value="fakturisane">
              Fakturisane ({tabTotals.fakturisane || 0})
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
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectId}
            onToggleSelectAll={toggleSelectAll}
            loading={loading}
            totalItems={totalItems}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
          />
        </TabsContent>

        <TabsContent value="fakturisane" className="mt-0">
          <TourTable
            tours={fakturisaneTours}
            searchQuery={searchQuery}
            showInvoiceButton={false}
            onUnmarkAsInvoiced={handleUnmarkAsInvoiced}
            onUpdateInvoiceNumber={handleUpdateInvoiceNumber}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelectId}
            onToggleSelectAll={toggleSelectAll}
            loading={loading}
            totalItems={totalItems}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
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
  selectionMode,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  loading,
  totalItems,
  loadingMore,
  onLoadMore,
}: {
  tours: HistoryTour[];
  searchQuery: string;
  showInvoiceButton: boolean;
  onMarkAsInvoiced?: (id: string, currentInvoiceNumber?: string | null) => void;
  onUnmarkAsInvoiced?: (id: string) => void;
  onUpdateInvoiceNumber?: (id: string, currentInvoiceNumber?: string | null) => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[], checked: boolean) => void;
  loading: boolean;
  totalItems: number;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  if (tours.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <SearchIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>{searchQuery ? "Nema rezultata pretrage" : "Nema tura u ovoj kategoriji"}</p>
      </div>
    );
  }

  // Grid columns: (Select) | Tip | Kompanija | Kamion | Prikolica | Vozač | Utovar | Istovar | Cijena | ADR | Završeno | Broj računa | Akcije
  const gridCols = selectionMode
    ? "grid-cols-[36px_70px_180px_120px_120px_140px_minmax(200px,1fr)_minmax(200px,1fr)_110px_70px_110px_120px_130px]"
    : "grid-cols-[70px_180px_120px_120px_140px_minmax(200px,1fr)_minmax(200px,1fr)_110px_70px_110px_120px_130px]";

  const allIds = tours.map((tour) => tour.id);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));

  return (
    <>
      {/* Table Header */}
      <div className={`grid ${gridCols} gap-2.5 px-3 py-3 bg-muted/50 border-y text-xs font-medium text-muted-foreground`}>
        {selectionMode && (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onToggleSelectAll(allIds, e.target.checked)}
              aria-label="Označi sve"
            />
          </div>
        )}
        <div className="flex items-center justify-center">Tip</div>
        <div className="flex items-center">Kompanija</div>
        <div className="flex items-center justify-start">Kamion</div>
        <div className="flex items-center justify-start">Prikolica</div>
        <div className="flex items-center justify-start">Vozač</div>
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
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>

      {/* Load More Button */}
      {!loading && tours.length < totalItems && (
        <div className="flex justify-center py-6 border-t">
          <Button 
            variant="outline" 
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                Učitavam...
              </>
            ) : (
              "Učitaj još"
            )}
          </Button>
        </div>
      )}
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
  selectionMode,
  selectedIds,
  onToggleSelect,
}: {
  tour: HistoryTour;
  gridCols: string;
  showInvoiceButton: boolean;
  onMarkAsInvoiced?: (id: string, currentInvoiceNumber?: string | null) => void;
  onUnmarkAsInvoiced?: (id: string) => void;
  onUpdateInvoiceNumber?: (id: string, currentInvoiceNumber?: string | null) => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  const [isUnloadingExpanded, setIsUnloadingExpanded] = useState(false);
  const hasMultipleUnloadings = tour.unloadingStops && tour.unloadingStops.length > 1;
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
      {selectionMode && (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={selectedIds.has(tour.id)}
            onChange={() => onToggleSelect(tour.id)}
            aria-label={`Označi turu ${tour.id}`}
          />
        </div>
      )}
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
        <EditCompanyInline
          tourId={tour.id}
          currentCompany={tour.company}
          onUpdated={() => {}}
        />
      </div>

      {/* Kamion */}
      <div className="flex items-center justify-start">
        <AssignVehicleHistory
          tourId={tour.id}
          vehicleType="KAMION"
          currentVehicle={tour.truck}
          onAssigned={() => {}}
        />
      </div>

      {/* Prikolica */}
      <div className="flex items-center justify-start">
        <AssignVehicleHistory
          tourId={tour.id}
          vehicleType="PRIKOLICA"
          currentVehicle={tour.trailer}
          onAssigned={() => {}}
        />
      </div>

      {/* Vozač */}
      <div className="flex items-center justify-start">
        <AssignDriverHistory
          tourId={tour.id}
          currentDriver={tour.driver}
          onAssigned={() => {}}
        />
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
          <>
            {/* Prikaži samo prvi istovar ako ih ima više i nisu expanded */}
            {(!hasMultipleUnloadings || isUnloadingExpanded ? tour.unloadingStops : [tour.unloadingStops[0]]).map((stop, idx) => (
              <div key={stop.id || idx} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-red-600 shrink-0" />
                  <span className="truncate" title={stop.location}>
                    {truncateText(stop.location)}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3 shrink-0" />
                  <span>{formatDate(stop.unloadingDate)}</span>
                  {hasMultipleUnloadings && idx === 0 && (
                    <button
                      onClick={() => setIsUnloadingExpanded(!isUnloadingExpanded)}
                      className="flex items-center gap-0.5 text-primary hover:text-primary/80 transition-colors ml-1"
                      title={isUnloadingExpanded ? "Prikaži manje" : "Prikaži sve istovare"}
                    >
                      {isUnloadingExpanded ? (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          <span>Manje</span>
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-3 w-3" />
                          <span>+{tour.unloadingStops.length - 1}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
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
