"use client";

import { useState, useEffect, useMemo } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Truck,
  User,
  MapPin,
  AlertCircle,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { bsLocale } from "@/lib/locale";

type CalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  eventType: string;
  color?: string | null;
  isSystem: boolean;
  sourceType?: string;
  sourceId?: string;
};

const eventTypeLabels: Record<string, string> = {
  CUSTOM: "Prilagođeni",
  VEHICLE_EXPIRY: "Istek vozila",
  DRIVER_EXPIRY: "Istek vozača",
  TOUR_LOADING: "Utovar",
  TOUR_UNLOADING: "Istovar",
};

const eventTypeIcons: Record<string, typeof CalendarDays> = {
  VEHICLE_EXPIRY: Truck,
  DRIVER_EXPIRY: User,
  TOUR_LOADING: MapPin,
  TOUR_UNLOADING: MapPin,
  CUSTOM: CalendarDays,
};

export function EventsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEventsDialog, setShowEventsDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formColor, setFormColor] = useState("#3b82f6");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      
      const response = await fetch(
        `/api/events?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Calculate padding days for the first week
  const firstDayOfMonth = startOfMonth(currentDate);
  const startPadding = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.date), date));
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length > 0) {
      setShowEventsDialog(true);
    } else {
      openAddDialog(date);
    }
  };

  const openAddDialog = (date?: Date) => {
    setEditingEvent(null);
    setFormTitle("");
    setFormDescription("");
    setFormDate(date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
    setFormColor("#3b82f6");
    setShowAddDialog(true);
  };

  const openEditDialog = (event: CalendarEvent) => {
    if (event.isSystem) return;
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || "");
    setFormDate(format(new Date(event.date), "yyyy-MM-dd"));
    setFormColor(event.color || "#3b82f6");
    setShowEventsDialog(false);
    setShowAddDialog(true);
  };

  const handleSaveEvent = async () => {
    if (!formTitle.trim()) {
      toast.error("Naziv događaja je obavezan");
      return;
    }

    setSaving(true);
    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events";
      const method = editingEvent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription || undefined,
          date: formDate,
          color: formColor,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save event");
      }

      toast.success(editingEvent ? "Događaj ažuriran" : "Događaj kreiran");
      setShowAddDialog(false);
      fetchEvents();
    } catch (error) {
      toast.error("Greška pri spremanju događaja");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      toast.success("Događaj obrisan");
      setShowEventsDialog(false);
      fetchEvents();
    } catch (error) {
      toast.error("Greška pri brisanju događaja");
    }
  };

  const weekDays = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

  const colorOptions = [
    "#3b82f6", // blue
    "#22c55e", // green
    "#ef4444", // red
    "#f97316", // orange
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#14b8a6", // teal
    "#f59e0b", // amber
  ];

  return (
    <div className="flex flex-col flex-1 p-8 max-w-7xl mx-auto w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {format(currentDate, "LLLL yyyy", { locale: bsLocale })}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={() => openAddDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novi događaj
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-muted-foreground">Istek registracije/vozačke</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-muted-foreground">Istek tehničkog/ljekarskog</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-muted-foreground">Utovar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-muted-foreground">Istovar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-muted-foreground">Prilagođeni</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden flex-1 flex flex-col">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 bg-muted/50 border-b">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 flex-1">
          {/* Empty cells for padding */}
          {Array.from({ length: startPadding }).map((_, index) => (
            <div
              key={`padding-${index}`}
              className="border-b border-r p-2 bg-muted/20 min-h-[100px]"
            />
          ))}

          {/* Actual days */}
          {daysInMonth.map((day) => {
            const dayEvents = getEventsForDate(day);
            const hasEvents = dayEvents.length > 0;
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={`border-b border-r p-2 min-h-[100px] cursor-pointer transition-colors hover:bg-muted/30 ${
                  isCurrentDay ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${
                      isCurrentDay
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  {hasEvents && (
                    <Badge variant="secondary" className="text-xs">
                      {dayEvents.length}
                    </Badge>
                  )}
                </div>

                {/* Event dots/previews */}
                <div className="flex flex-col gap-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-1 text-xs truncate"
                      title={event.title}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: event.color || "#3b82f6" }}
                      />
                      <span className="truncate">{event.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{dayEvents.length - 3} više
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Events Dialog */}
      <Dialog open={showEventsDialog} onOpenChange={setShowEventsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Događaji - {selectedDate && format(selectedDate, "d. MMMM yyyy", { locale: bsLocale })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {selectedDate &&
              getEventsForDate(selectedDate).map((event) => {
                const Icon = eventTypeIcons[event.eventType] || CalendarDays;
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${event.color}20` }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: event.color || "#3b82f6" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{event.title}</span>
                        {event.isSystem && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            Automatski
                          </Badge>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {event.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {eventTypeLabels[event.eventType] || event.eventType}
                      </p>
                    </div>
                    {!event.isSystem && (
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(event)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEventsDialog(false);
                if (selectedDate) openAddDialog(selectedDate);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Dodaj događaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Uredi događaj" : "Novi događaj"}
            </DialogTitle>
            <DialogDescription>
              {editingEvent
                ? "Uredite detalje događaja"
                : "Dodajte novi prilagođeni događaj u kalendar"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Naziv *</Label>
              <Input
                id="title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Naziv događaja"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Datum *</Label>
              <Input
                id="date"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Opcionalni opis događaja"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Boja</Label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formColor === color
                        ? "border-foreground scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Odustani
            </Button>
            <Button onClick={handleSaveEvent} disabled={saving}>
              {saving ? "Spremanje..." : editingEvent ? "Spremi" : "Dodaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
