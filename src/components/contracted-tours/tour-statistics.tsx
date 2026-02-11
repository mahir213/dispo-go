"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Building2,
  Euro,
  Package,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type MonthlyStats = {
  month: number;
  monthName: string;
  totalRevenue: number;
  uvozRevenue: number;
  izvozRevenue: number;
  medjuturaRevenue: number;
  totalTours: number;
  uvozCount: number;
  izvozCount: number;
  medjuturaCount: number;
  invoicedCount: number;
  uninvoicedCount: number;
};

type YearlyTotal = {
  totalRevenue: number;
  uvozRevenue: number;
  izvozRevenue: number;
  medjuturaRevenue: number;
  totalTours: number;
  uvozCount: number;
  izvozCount: number;
  medjuturaCount: number;
  invoicedCount: number;
  uninvoicedCount: number;
};

type TopCompany = {
  company: string;
  totalRevenue: number;
  tourCount: number;
};

type Averages = {
  uvozAverage: number;
  izvozAverage: number;
  medjuturaAverage: number;
  overallAverage: number;
};

type StatisticsData = {
  year: number;
  monthlyStats: MonthlyStats[];
  yearlyTotal: YearlyTotal;
  topCompanies: TopCompany[];
  averages: Averages;
};

export function TourStatistics() {
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchStatistics();
  }, [selectedYear]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/contracted-tours/statistics?year=${selectedYear}`
      );
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("hr-HR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Nema dostupnih podataka
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="p-8 space-y-6">
      {/* Year Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Statistika poslovanja</h2>
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Izaberi godinu" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ukupna zarada</CardTitle>
            <Euro className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              €{formatCurrency(statistics.yearlyTotal.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.yearlyTotal.totalTours} tura u {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uvoz</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{formatCurrency(statistics.yearlyTotal.uvozRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.yearlyTotal.uvozCount} tura (
              {statistics.yearlyTotal.totalTours > 0
                ? Math.round(
                    (statistics.yearlyTotal.uvozCount /
                      statistics.yearlyTotal.totalTours) *
                      100
                  )
                : 0}
              %)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Izvoz</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{formatCurrency(statistics.yearlyTotal.izvozRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.yearlyTotal.izvozCount} tura (
              {statistics.yearlyTotal.totalTours > 0
                ? Math.round(
                    (statistics.yearlyTotal.izvozCount /
                      statistics.yearlyTotal.totalTours) *
                      100
                  )
                : 0}
              %)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Međutura</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{formatCurrency(statistics.yearlyTotal.medjuturaRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.yearlyTotal.medjuturaCount} tura (
              {statistics.yearlyTotal.totalTours > 0
                ? Math.round(
                    (statistics.yearlyTotal.medjuturaCount /
                      statistics.yearlyTotal.totalTours) *
                      100
                  )
                : 0}
              %)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Average Prices and Invoice Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="border-b border-primary/20">
            <CardTitle className="text-base">Prosječne cijene po tipu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Uvoz:</span>
              <span className="font-semibold">
                €{formatCurrency(statistics.averages.uvozAverage)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Izvoz:</span>
              <span className="font-semibold">
                €{formatCurrency(statistics.averages.izvozAverage)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Međutura:</span>
              <span className="font-semibold">
                €{formatCurrency(statistics.averages.medjuturaAverage)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-primary/20">
              <span className="text-sm font-medium">Ukupno prosjek:</span>
              <span className="font-bold text-primary">
                €{formatCurrency(statistics.averages.overallAverage)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-primary/20">
            <CardTitle className="text-base">Status fakturisanja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Fakturisano:
                </span>
              </div>
              <span className="font-semibold">
                {statistics.yearlyTotal.invoicedCount} tura (
                {statistics.yearlyTotal.totalTours > 0
                  ? Math.round(
                      (statistics.yearlyTotal.invoicedCount /
                        statistics.yearlyTotal.totalTours) *
                        100
                    )
                  : 0}
                %)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Nefakturisano:
                </span>
              </div>
              <span className="font-semibold">
                {statistics.yearlyTotal.uninvoicedCount} tura (
                {statistics.yearlyTotal.totalTours > 0
                  ? Math.round(
                      (statistics.yearlyTotal.uninvoicedCount /
                        statistics.yearlyTotal.totalTours) *
                        100
                    )
                  : 0}
                %)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Statistics Table */}
      <Card>
        <CardHeader className="border-b border-primary/20">
          <CardTitle>Mjesečna statistika</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mjesec</TableHead>
                  <TableHead className="text-right">Ukupno</TableHead>
                  <TableHead className="text-right">Uvoz</TableHead>
                  <TableHead className="text-right">Izvoz</TableHead>
                  <TableHead className="text-right">
                    Međutura
                  </TableHead>
                  <TableHead className="text-right">Broj tura</TableHead>
                  <TableHead className="text-right">Fakturisano</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statistics.monthlyStats.map((month) => (
                  <TableRow key={month.month} className="hover:bg-muted/50">
                    <TableCell className="font-medium border-l-2 border-l-transparent hover:border-l-primary transition-colors">
                      {month.monthName}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      €{formatCurrency(month.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      €{formatCurrency(month.uvozRevenue)}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({month.uvozCount})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      €{formatCurrency(month.izvozRevenue)}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({month.izvozCount})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      €{formatCurrency(month.medjuturaRevenue)}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({month.medjuturaCount})
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {month.totalTours}
                    </TableCell>
                    <TableCell className="text-right">
                      {month.invoicedCount}/{month.totalTours}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow className="bg-primary/5 font-bold border-t-2 border-t-primary">
                  <TableCell className="border-l-2 border-l-primary">UKUPNO</TableCell>
                  <TableCell className="text-right text-primary">
                    €{formatCurrency(statistics.yearlyTotal.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    €{formatCurrency(statistics.yearlyTotal.uvozRevenue)}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({statistics.yearlyTotal.uvozCount})
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    €{formatCurrency(statistics.yearlyTotal.izvozRevenue)}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({statistics.yearlyTotal.izvozCount})
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    €{formatCurrency(statistics.yearlyTotal.medjuturaRevenue)}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({statistics.yearlyTotal.medjuturaCount})
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {statistics.yearlyTotal.totalTours}
                  </TableCell>
                  <TableCell className="text-right">
                    {statistics.yearlyTotal.invoicedCount}/
                    {statistics.yearlyTotal.totalTours}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Top Companies */}
      {statistics.topCompanies.length > 0 && (
        <Card>
          <CardHeader className="border-b border-primary/20">
            <CardTitle>Kompanije (sortirano po zaradi)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statistics.topCompanies.map((company, index) => (
                <div
                  key={company.company}
                  className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{company.company}</div>
                      <div className="text-xs text-muted-foreground">
                        {company.tourCount} tura
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      €{formatCurrency(company.totalRevenue)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      prosjek: €
                      {formatCurrency(company.totalRevenue / company.tourCount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
