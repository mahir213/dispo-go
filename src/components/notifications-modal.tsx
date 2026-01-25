"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { AlertCircle, BellIcon, XIcon } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
  vehicleId: string;
  vehicleName: string;
  registrationNumber: string;
  type: string;
  status: "expired" | "expiring";
  daysUntil: number;
  expiryDate: string;
}

interface NotificationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsModal({ open, onOpenChange }: NotificationsModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/vehicles/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellIcon className="h-5 w-5" />
            Notifikacije
          </DialogTitle>
          <DialogDescription>
            Pregled dokumenata koji ističu ili su istekli
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <BellIcon className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-muted-foreground">Nema notifikacija</p>
            <p className="text-sm text-muted-foreground mt-1">
              Svi dokumenti su uredni
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto space-y-3 pr-2">
            {notifications.map((notification, index) => (
              <Link
                key={`${notification.vehicleId}-${notification.type}-${index}`}
                href={`/vozila/${notification.vehicleId}`}
                onClick={() => onOpenChange(false)}
                className="block"
              >
                <div
                  className={`p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                    notification.status === "expired"
                      ? "border-destructive/50 bg-destructive/5"
                      : "border-orange-500/50 bg-orange-500/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle
                          className={`h-4 w-4 ${
                            notification.status === "expired"
                              ? "text-destructive"
                              : "text-orange-500"
                          }`}
                        />
                        <span className="font-medium">{notification.vehicleName}</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {notification.registrationNumber}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {notification.type}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          {format(new Date(notification.expiryDate), "dd.MM.yyyy")}
                        </span>
                        {notification.status === "expired" ? (
                          <Badge variant="destructive" className="text-xs">
                            Isteklo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs bg-orange-500/10 text-orange-700 dark:text-orange-400"
                          >
                            Ističe za {notification.daysUntil}{" "}
                            {notification.daysUntil === 1 ? "dan" : "dana"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
