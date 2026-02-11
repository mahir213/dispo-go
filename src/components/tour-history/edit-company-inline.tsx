"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Building2, Check, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditCompanyInlineProps {
  tourId: string;
  currentCompany: string;
  onUpdated?: () => void;
}

export function EditCompanyInline({ 
  tourId, 
  currentCompany, 
  onUpdated 
}: EditCompanyInlineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [company, setCompany] = useState(currentCompany);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!company.trim()) {
      toast.error("Ime kompanije je obavezno");
      return;
    }

    if (company === currentCompany) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      // Get current tour data first
      const tourResponse = await fetch(`/api/contracted-tours/${tourId}`);
      if (!tourResponse.ok) throw new Error("Failed to fetch tour");
      const tourData = await tourResponse.json();

      // Update with new company name - send only fields required by schema
      const response = await fetch(`/api/contracted-tours/${tourId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourType: tourData.tourType,
          loadingLocation: tourData.loadingLocation,
          loadingDate: tourData.loadingDate,
          exportCustoms: tourData.exportCustoms || undefined,
          importCustoms: tourData.importCustoms || undefined,
          price: Number(tourData.price),
          company: company.trim(),
          isADR: tourData.isADR,
          unloadingStops: tourData.unloadingStops.map((stop: any) => ({
            location: stop.location,
            unloadingDate: stop.unloadingDate,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update company");
      }

      toast.success("Kompanija ažurirana");
      setIsEditing(false);
      onUpdated?.();
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri ažuriranju kompanije");
      setCompany(currentCompany);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCompany(currentCompany);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="h-7 text-sm px-2 flex-1"
          disabled={saving}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={handleSave}
          disabled={saving}
        >
          <Check className="h-3.5 w-3.5 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={handleCancel}
          disabled={saving}
        >
          <X className="h-3.5 w-3.5 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-1.5 min-w-0 group hover:bg-muted/50 px-1 py-0.5 rounded transition-colors"
    >
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="font-medium text-sm truncate" title={currentCompany}>
        {currentCompany.length > 15 ? currentCompany.substring(0, 15) + "..." : currentCompany}
      </span>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </button>
  );
}
