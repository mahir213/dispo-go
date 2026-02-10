"use client";

import { useState, useEffect } from "react";
import {
  HandshakeIcon,
  SearchIcon,
  Building2,
  MapPin,
  ArrowRight,
  Euro,
  AlertTriangle,
  MoreVertical,
  Pencil,
  Trash2,
  CalendarDays,
  PlayCircle,
  Eye,
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
import { AddContractedTourDialog } from "./add-contracted-tour-dialog";
import { EditContractedTourDialog } from "./edit-contracted-tour-dialog";
import { DeleteContractedTourDialog } from "./delete-contracted-tour-dialog";
import { ActivateTourDialog } from "./activate-tour-dialog";
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

type ContractedTour = {
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
  driverId: string | null;
  driver: Driver | null;
  truckId: string | null;
  truck: Vehicle | null;
  trailerId: string | null;
  trailer: Vehicle | null;
  createdAt: string;
  updatedAt: string;
};

export function ContractedToursList() {
  const [tours, setTours] = useState<ContractedTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [editTour, setEditTour] = useState<ContractedTour | null>(null);
  const [deleteTour, setDeleteTour] = useState<ContractedTour | null>(null);
  const [activateTour, setActivateTour] = useState<ContractedTour | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [activeTab, setActiveTab] = useState("ugovorene");
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

  const ugovoreneTours = tours.filter((t) => t.driverId === null);
  const uvozTours = tours.filter((t) => t.tourType === "UVOZ" && t.driverId === null);
  const izvozTours = tours.filter((t) => t.tourType === "IZVOZ" && t.driverId === null);
  const medjuturaTours = tours.filter((t) => t.tourType === "MEDJUTURA" && t.driverId === null);

  if (loading) {
    return <ContractedToursLoading />;
  }

  if (tours.length === 0 && !debouncedSearchQuery) {
    return <ContractedToursEmpty />;
  }

  return (
    <div className="flex flex-col w-full -ml-12">
      {/* Search Bar */}
      <div className="px-8 py-4 border-b">
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Pretraži po kompaniji, lokaciji..."
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
            <TabsTrigger value="ugovorene">
              Sve ({ugovoreneTours.length})
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

        <TabsContent value="ugovorene" className="mt-0">
          <TourTable
            tours={ugovoreneTours}
            onEdit={setEditTour}
            onDelete={setDeleteTour}
            onActivate={setActivateTour}
            searchQuery={searchQuery}
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </TabsContent>

        <TabsContent value="uvoz" className="mt-0">
          <TourTable
            tours={uvozTours}
            onEdit={setEditTour}
            onDelete={setDeleteTour}
            onActivate={setActivateTour}
            searchQuery={searchQuery}
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </TabsContent>

        <TabsContent value="izvoz" className="mt-0">
          <TourTable
            tours={izvozTours}
            onEdit={setEditTour}
            onDelete={setDeleteTour}
            onActivate={setActivateTour}
            searchQuery={searchQuery}
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </TabsContent>

        <TabsContent value="medjutura" className="mt-0">
          <TourTable
            tours={medjuturaTours}
            onEdit={setEditTour}
            onDelete={setDeleteTour}
            onActivate={setActivateTour}
            searchQuery={searchQuery}
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

      {/* Activate Dialog */}
      {activateTour && (
        <ActivateTourDialog
          tourId={activateTour.id}
          tourName={`${activateTour.company} - ${activateTour.loadingLocation} → ${activateTour.unloadingStops?.[0]?.location || "?"}`}
          open={!!activateTour}
          onOpenChange={(open) => !open && setActivateTour(null)}
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
  onActivate,
  searchQuery,
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: {
  tours: ContractedTour[];
  onEdit: (tour: ContractedTour) => void;
  onDelete: (tour: ContractedTour) => void;
  onActivate: (tour: ContractedTour) => void;
  searchQuery: string;
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

  // Grid columns: Tip | Kompanija | Kamion | Prikolica | Utovar | Istovar | Carine | Cijena | ADR | Aktiviraj | Akcije
  const gridCols = "grid-cols-[60px_minmax(90px,120px)_95px_95px_minmax(150px,1fr)_minmax(150px,1fr)_100px_85px_55px_90px_45px]";

  return (
    <>
      {/* Table Header */}
      <div className={`grid ${gridCols} gap-2.5 px-3 py-3 bg-muted/50 border-y text-xs font-medium text-muted-foreground`}>
        <div className="flex items-center justify-center">Tip</div>
        <div className="flex items-center">Kompanija</div>
        <div className="flex items-center justify-center">Kamion</div>
        <div className="flex items-center justify-center">Prikolica</div>
        <div className="flex items-center">Utovar</div>
        <div className="flex items-center">Istovar</div>
        <div className="flex items-center justify-center">Carine</div>
        <div className="flex items-center justify-center">Cijena</div>
        <div className="flex items-center justify-center">ADR</div>
        <div></div>
        <div></div>
      </div>

      {/* Table Body */}
      <div className="divide-y">
        {tours.map((tour) => (
          <TourRow key={tour.id} tour={tour} onEdit={onEdit} onDelete={onDelete} onActivate={onActivate} gridCols={gridCols} />
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
  onEdit,
  onDelete,
  onActivate,
  gridCols,
}: {
  tour: ContractedTour;
  onEdit: (tour: ContractedTour) => void;
  onDelete: (tour: ContractedTour) => void;
  onActivate: (tour: ContractedTour) => void;
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
          <div className="text-xs text-center">{tour.truck.registrationNumber}</div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </div>

      {/* Prikolica */}
      <div className="flex items-center justify-center">
        {tour.trailer ? (
          <div className="text-xs text-center">{tour.trailer.registrationNumber}</div>
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

      {/* Carine */}
      <div className="flex flex-col items-center justify-center gap-0.5 text-xs text-muted-foreground">
        {tour.exportCustoms ? (
          <div title={`Izvozna: ${tour.exportCustoms}`}>
            {`Izv: ${tour.exportCustoms.length > 15 ? tour.exportCustoms.substring(0, 15) + "..." : tour.exportCustoms}`}
          </div>
        ) : (
          <div>Izv: -</div>
        )}
        {tour.importCustoms ? (
          <div title={`Uvozna: ${tour.importCustoms}`}>
            {`Uv: ${tour.importCustoms.length > 15 ? tour.importCustoms.substring(0, 15) + "..." : tour.importCustoms}`}
          </div>
        ) : (
          <div>Uv: -</div>
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

      {/* Aktiviraj */}
      <div className="flex items-center justify-center">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1.5 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={() => onActivate(tour)}
        >
          <PlayCircle className="h-3.5 w-3.5" />
          Aktiviraj
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

function ContractedToursEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <HandshakeIcon className="h-16 w-16 text-muted-foreground" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">Nema ugovorenih tura</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Započnite dodavanjem prve ugovorene ture
        </p>
      </div>
    </div>
  );
}

export function ContractedToursHeader() {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b w-full">
      <div>
        <h1 className="text-2xl font-bold">Ugovoreno</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upravljanje ugovorenim turama
        </p>
      </div>
      <AddContractedTourDialog />
    </div>
  );
}

export function ContractedToursContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-col h-full">{children}</div>;
}

export function ContractedToursLoading() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}

export function ContractedToursError() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-destructive">Greška</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Došlo je do greške pri učitavanju ugovorenih tura
        </p>
      </div>
    </div>
  );
}
