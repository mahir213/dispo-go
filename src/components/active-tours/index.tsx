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
  ChevronDown,
  ChevronRight,
  Link2,
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
  parentTourId: string | null;
  childTours?: ActiveTour[];
  createdAt: string;
  updatedAt: string;
};

export function ActiveToursList() {
  const [tours, setTours] = useState<ActiveTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [editTour, setEditTour] = useState<ActiveTour | null>(null);
  const [deleteTour, setDeleteTour] = useState<ActiveTour | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeTab, setActiveTab] = useState("sve");
  const [initialLoadDone, setInitialLoadDone] = useState(false);
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
      filterCompleted: "false",
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
        const allTours = (data.tours || []).filter((tour: ActiveTour) => 
          tour.driverId !== null && tour.isCompleted !== true
        );
        
        // Group tours: find parent tours and attach their children
        const parentTours = allTours.filter((t: ActiveTour) => !t.parentTourId);
        const childTours = allTours.filter((t: ActiveTour) => t.parentTourId);
        
        // Attach children to their parents
        const groupedTours = parentTours.map((parent: ActiveTour) => ({
          ...parent,
          childTours: childTours.filter((child: ActiveTour) => child.parentTourId === parent.id)
        }));
        
        setTours(groupedTours);
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

  const getLastUnloadingDate = (tour: ActiveTour): Date | null => {
    if (!tour.unloadingStops || tour.unloadingStops.length === 0) return null;
    const lastStop = tour.unloadingStops[tour.unloadingStops.length - 1];
    return lastStop.unloadingDate ? new Date(lastStop.unloadingDate) : null;
  };

  const sortTours = (toursToSort: ActiveTour[]): ActiveTour[] => {
    if (!sortOrder) return toursToSort;
    
    return [...toursToSort].sort((a, b) => {
      const dateA = getLastUnloadingDate(a);
      const dateB = getLastUnloadingDate(b);
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      const comparison = dateA.getTime() - dateB.getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const sortedTours = sortTours(tours);
  const uvozTours = sortTours(tours.filter((t) => t.tourType === "UVOZ"));
  const izvozTours = sortTours(tours.filter((t) => t.tourType === "IZVOZ"));
  const medjuturaTours = sortTours(tours.filter((t) => t.tourType === "MEDJUTURA"));

  if (loading) {
    return <ActiveToursLoading />;
  }

  if (tours.length === 0 && !debouncedSearchQuery) {
    return <ActiveToursEmpty />;
  }

  return (
    <div className="flex flex-col w-full -ml-12">
      {/* Search Bar */}
      <div className="px-8 py-4 border-b">
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Pretraži po vozaču, tablicama, lokaciji..."
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
            <TabsTrigger value="sve">
              Sve ({sortedTours.length})
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
            key="sve"
            activeTab={activeTab}
            tours={sortedTours}
            onEdit={setEditTour}
            onDelete={setDeleteTour}
            onComplete={handleCompleteTour}
            searchQuery={searchQuery}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </TabsContent>

        <TabsContent value="uvoz" className="mt-0">
          <TourTable
            key="uvoz"
            activeTab={activeTab}
            tours={uvozTours}
            onEdit={setEditTour}
            onDelete={setDeleteTour}
            onComplete={handleCompleteTour}
            searchQuery={searchQuery}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </TabsContent>

        <TabsContent value="izvoz" className="mt-0">
          <TourTable
            key="izvoz"
            activeTab={activeTab}
            tours={izvozTours}
            onEdit={setEditTour}
            onDelete={setDeleteTour}
            onComplete={handleCompleteTour}
            searchQuery={searchQuery}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </TabsContent>

        <TabsContent value="medjutura" className="mt-0">
          <TourTable
            key="medjutura"
            activeTab={activeTab}
            tours={medjuturaTours}
            onEdit={setEditTour}
            onDelete={setDeleteTour}
            onComplete={handleCompleteTour}
            searchQuery={searchQuery}
            sortOrder={sortOrder}
            onSortChange={setSortOrder}
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
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
  activeTab,
  tours,
  onEdit,
  onDelete,
  onComplete,
  searchQuery,
  sortOrder,
  onSortChange,
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  activeTab: string;
  tours: ActiveTour[];
  onEdit: (tour: ActiveTour) => void;
  onDelete: (tour: ActiveTour) => void;
  onComplete: (tourId: string) => void;
  searchQuery: string;
  sortOrder: "asc" | "desc" | null;
  onSortChange: (order: "asc" | "desc" | null) => void;
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}) {
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
  const gridCols = "grid-cols-[70px_180px_120px_120px_140px_minmax(200px,1fr)_minmax(200px,1fr)_140px_110px_70px_100px_50px]";

  return (
    <>
      {/* Table Header */}
      <div className={`grid ${gridCols} gap-2.5 px-3 py-3 bg-muted/50 border-y text-xs font-medium text-muted-foreground`}>
        <div className="flex items-center justify-center">Tip</div>
        <div className="flex items-center">Kompanija</div>
        <div className="flex items-center justify-start">Kamion</div>
        <div className="flex items-center justify-start">Prikolica</div>
        <div className="flex items-center justify-start">Vozač</div>
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
        {tours.map((tour) => (
          <TourRow key={`${activeTab}-${tour.id}`} activeTab={activeTab} tour={tour} onEdit={onEdit} onDelete={onDelete} onComplete={onComplete} gridCols={gridCols} />
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
  activeTab,
  tour,
  onEdit,
  onDelete,
  onComplete,
  gridCols,
}: {
  activeTab: string;
  tour: ActiveTour;
  onEdit: (tour: ActiveTour) => void;
  onDelete: (tour: ActiveTour) => void;
  onComplete: (tourId: string) => void;
  gridCols: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUnloadingExpanded, setIsUnloadingExpanded] = useState(false);
  const hasChildren = tour.childTours && tour.childTours.length > 0;
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
    <>
      <div className={`grid ${gridCols} gap-2.5 px-3 py-3 hover:bg-muted/30 transition-colors items-center ${hasChildren ? 'border-l-4 border-l-primary' : ''}`}>
      {/* Tip */}
      <div className="flex items-center justify-center gap-1">
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-muted rounded transition-colors"
            title={isExpanded ? "Skupi" : "Proširi"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        <Badge 
          variant={getTourTypeBadgeVariant(tour.tourType) as "default" | "secondary" | "outline"}
          className="text-xs whitespace-nowrap"
        >
          {getTourTypeLabel(tour.tourType)}
          {hasChildren && (
            <span className="ml-0.5 text-[9px] bg-primary text-primary-foreground px-0.5 rounded">
              +{tour.childTours!.length}
            </span>
          )}
        </Badge>
      </div>

      {/* Kompanija */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-medium text-sm truncate" title={tour.company}>{truncateText(tour.company)}</span>
      </div>

      {/* Kamion */}
      <div className="flex items-center justify-start">
        <AssignVehicle tourId={tour.id} vehicleType="KAMION" currentVehicle={tour.truck} />
      </div>

      {/* Prikolica */}
      <div className="flex items-center justify-start">
        <AssignVehicle tourId={tour.id} vehicleType="PRIKOLICA" currentVehicle={tour.trailer} />
      </div>

      {/* Vozač */}
      <div className="flex items-center justify-start">
        <AssignDriver tourId={tour.id} currentDriver={tour.driver} />
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
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3 shrink-0" />
                  <span>{formatDate(stop.unloadingDate)}</span>
                  {/* Dugme za expand/collapse ako ima više istovara - inline sa datumom */}
                  {hasMultipleUnloadings && idx === 0 && (
                    <button
                      onClick={() => setIsUnloadingExpanded(!isUnloadingExpanded)}
                      className="flex items-center gap-0.5 text-xs text-primary hover:text-primary/80 transition-colors ml-1"
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

      {/* Carine */}
      <div className="flex flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground">
        {tour.exportCustoms && (
          <div title={`Izvozna: ${tour.exportCustoms}`}>
            {`Izv: ${tour.exportCustoms.length > 15 ? tour.exportCustoms.substring(0, 15) + "..." : tour.exportCustoms}`}
          </div>
        )}
        {!tour.exportCustoms && tour.importCustoms && (
          <div className="text-xs text-muted-foreground">-</div>
        )}
        {tour.importCustoms && (
          <div title={`Uvozna: ${tour.importCustoms}`}>
            {`Uv: ${tour.importCustoms.length > 15 ? tour.importCustoms.substring(0, 15) + "..." : tour.importCustoms}`}
          </div>
        )}
        {!tour.exportCustoms && !tour.importCustoms && (
          <div className="text-xs text-muted-foreground">-</div>
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
    
    {/* Child Tours */}
    {hasChildren && isExpanded && (
      <div className="bg-accent/20 border-l-4 border-l-primary">
        {tour.childTours!.map((childTour) => (
          <ChildTourRow
            key={`${activeTab}-${childTour.id}`}
            childTour={childTour}
            gridCols={gridCols}
            onEdit={onEdit}
            onDelete={onDelete}
            onComplete={onComplete}
            getTourTypeLabel={getTourTypeLabel}
            getTourTypeBadgeVariant={getTourTypeBadgeVariant}
            formatDate={formatDate}
            truncateText={truncateText}
          />
        ))}
      </div>
    )}
    </>
  );
}

function ChildTourRow({
  childTour,
  gridCols,
  onEdit,
  onDelete,
  onComplete,
  getTourTypeLabel,
  getTourTypeBadgeVariant,
  formatDate,
  truncateText,
}: {
  childTour: ActiveTour;
  gridCols: string;
  onEdit: (tour: ActiveTour) => void;
  onDelete: (tour: ActiveTour) => void;
  onComplete: (tourId: string) => void;
  getTourTypeLabel: (type: string) => string;
  getTourTypeBadgeVariant: (type: string) => string;
  formatDate: (dateString: string | null) => string;
  truncateText: (text: string, maxLength?: number) => string;
}) {
  const [isUnloadingExpanded, setIsUnloadingExpanded] = useState(false);
  const hasMultipleUnloadings = childTour.unloadingStops && childTour.unloadingStops.length > 1;

  return (
    <div className={`grid ${gridCols} gap-2.5 px-3 py-3 pl-12 hover:bg-muted/30 transition-colors items-center border-b border-dashed`}>
      {/* Tip */}
      <div className="flex items-center justify-center gap-1">
        <Link2 className="h-3 w-3 text-muted-foreground" />
        <Badge 
          variant={getTourTypeBadgeVariant(childTour.tourType) as "default" | "secondary" | "outline"}
          className="text-xs whitespace-nowrap"
        >
          {getTourTypeLabel(childTour.tourType)}
        </Badge>
      </div>

      {/* Kompanija */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-medium text-sm truncate" title={childTour.company}>{truncateText(childTour.company)}</span>
      </div>

      {/* Kamion - inherited from parent */}
      <div className="flex items-center justify-start" title="Isti kao parent tura">
        <span className="text-muted-foreground font-mono">-||-</span>
      </div>

      {/* Prikolica - inherited from parent */}
      <div className="flex items-center justify-start" title="Ista kao parent tura">
        <span className="text-muted-foreground font-mono">-||-</span>
      </div>

      {/* Vozač - inherited from parent */}
      <div className="flex items-center justify-start" title="Isti kao parent tura">
        <span className="text-muted-foreground font-mono">-||-</span>
      </div>

      {/* Utovar */}
      <div className="flex flex-col justify-center gap-0.5 min-w-0">
        <div className="flex items-center gap-1.5 text-sm">
          <MapPin className="h-3.5 w-3.5 text-green-600 shrink-0" />
          <span className="truncate" title={childTour.loadingLocation}>
            {truncateText(childTour.loadingLocation)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span>{formatDate(childTour.loadingDate)}</span>
        </div>
      </div>

      {/* Istovar */}
      <div className="flex flex-col justify-center gap-1 min-w-0">
        {childTour.unloadingStops && childTour.unloadingStops.length > 0 ? (
          <>
            {/* Prikaži samo prvi istovar ako ih ima više i nisu expanded */}
            {(!hasMultipleUnloadings || isUnloadingExpanded ? childTour.unloadingStops : [childTour.unloadingStops[0]]).map((stop, idx) => (
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
                          <span>+{childTour.unloadingStops.length - 1}</span>
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

      {/* Carine */}
      <div className="flex flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground">
        {childTour.exportCustoms && (
          <div title={`Izvozna: ${childTour.exportCustoms}`}>
            {`Izv: ${childTour.exportCustoms.length > 15 ? childTour.exportCustoms.substring(0, 15) + "..." : childTour.exportCustoms}`}
          </div>
        )}
        {!childTour.exportCustoms && childTour.importCustoms && (
          <div className="text-xs text-muted-foreground">-</div>
        )}
        {childTour.importCustoms && (
          <div title={`Uvozna: ${childTour.importCustoms}`}>
            {`Uv: ${childTour.importCustoms.length > 15 ? childTour.importCustoms.substring(0, 15) + "..." : childTour.importCustoms}`}
          </div>
        )}
        {!childTour.exportCustoms && !childTour.importCustoms && (
          <div className="text-xs text-muted-foreground">-</div>
        )}
      </div>

      {/* Cijena */}
      <PriceCell price={childTour.price} />

      {/* ADR */}
      <div className="flex items-center justify-center">
        {childTour.isADR ? (
          <Badge variant="destructive" className="text-xs gap-0.5">
            <AlertTriangle className="h-3 w-3" />
            ADR
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </div>

      {/* Završi - child can be completed independently */}
      <div className="flex items-center justify-center">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
          onClick={() => onComplete(childTour.id)}
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
            <DropdownMenuItem onClick={() => onEdit(childTour)}>
              <Pencil className="h-4 w-4 mr-2" />
              Uredi
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(childTour)}
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
