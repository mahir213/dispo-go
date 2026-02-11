import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { checkAuth, requirePermission } from "@/lib/api-auth";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const authResult = await checkAuth();
    const permissionError = requirePermission(authResult, "view_tours");
    if (permissionError) return permissionError;
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    // Get all completed tours for the organization in the specified year
    const tours = await prisma.contractedTour.findMany({
      where: {
        organizationId: authResult.user.organizationId,
        isCompleted: true,
        completedAt: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31T23:59:59`),
        },
      },
      select: {
        id: true,
        tourType: true,
        price: true,
        completedAt: true,
        company: true,
        isInvoiced: true,
        invoiceNumber: true,
      },
    });

    // Calculate monthly statistics
    const monthlyStats = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthTours = tours.filter((tour) => {
        const tourMonth = tour.completedAt ? new Date(tour.completedAt).getMonth() + 1 : 0;
        return tourMonth === month;
      });

      const uvozTours = monthTours.filter((t) => t.tourType === "UVOZ");
      const izvozTours = monthTours.filter((t) => t.tourType === "IZVOZ");
      const medjuturaTours = monthTours.filter((t) => t.tourType === "MEDJUTURA");

      const totalRevenue = monthTours.reduce(
        (sum, tour) => sum + Number(tour.price),
        0
      );
      const uvozRevenue = uvozTours.reduce(
        (sum, tour) => sum + Number(tour.price),
        0
      );
      const izvozRevenue = izvozTours.reduce(
        (sum, tour) => sum + Number(tour.price),
        0
      );
      const medjuturaRevenue = medjuturaTours.reduce(
        (sum, tour) => sum + Number(tour.price),
        0
      );

      return {
        month,
        monthName: new Date(year, month - 1).toLocaleString("bs-BA", {
          month: "long",
        }),
        totalRevenue,
        uvozRevenue,
        izvozRevenue,
        medjuturaRevenue,
        totalTours: monthTours.length,
        uvozCount: uvozTours.length,
        izvozCount: izvozTours.length,
        medjuturaCount: medjuturaTours.length,
        invoicedCount: monthTours.filter((t) => t.isInvoiced).length,
        uninvoicedCount: monthTours.filter((t) => !t.isInvoiced).length,
      };
    });

    // Calculate yearly totals
    const yearlyTotal = {
      totalRevenue: tours.reduce((sum, tour) => sum + Number(tour.price), 0),
      uvozRevenue: tours
        .filter((t) => t.tourType === "UVOZ")
        .reduce((sum, tour) => sum + Number(tour.price), 0),
      izvozRevenue: tours
        .filter((t) => t.tourType === "IZVOZ")
        .reduce((sum, tour) => sum + Number(tour.price), 0),
      medjuturaRevenue: tours
        .filter((t) => t.tourType === "MEDJUTURA")
        .reduce((sum, tour) => sum + Number(tour.price), 0),
      totalTours: tours.length,
      uvozCount: tours.filter((t) => t.tourType === "UVOZ").length,
      izvozCount: tours.filter((t) => t.tourType === "IZVOZ").length,
      medjuturaCount: tours.filter((t) => t.tourType === "MEDJUTURA").length,
      invoicedCount: tours.filter((t) => t.isInvoiced).length,
      uninvoicedCount: tours.filter((t) => !t.isInvoiced).length,
    };

    // Get top companies
    const companyStats = tours.reduce((acc, tour) => {
      if (!acc[tour.company]) {
        acc[tour.company] = {
          company: tour.company,
          totalRevenue: 0,
          tourCount: 0,
        };
      }
      acc[tour.company].totalRevenue += Number(tour.price);
      acc[tour.company].tourCount += 1;
      return acc;
    }, {} as Record<string, { company: string; totalRevenue: number; tourCount: number }>);

    const topCompanies = Object.values(companyStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate average price per tour type
    const averages = {
      uvozAverage:
        yearlyTotal.uvozCount > 0
          ? yearlyTotal.uvozRevenue / yearlyTotal.uvozCount
          : 0,
      izvozAverage:
        yearlyTotal.izvozCount > 0
          ? yearlyTotal.izvozRevenue / yearlyTotal.izvozCount
          : 0,
      medjuturaAverage:
        yearlyTotal.medjuturaCount > 0
          ? yearlyTotal.medjuturaRevenue / yearlyTotal.medjuturaCount
          : 0,
      overallAverage:
        yearlyTotal.totalTours > 0
          ? yearlyTotal.totalRevenue / yearlyTotal.totalTours
          : 0,
    };

    return NextResponse.json({
      year,
      monthlyStats,
      yearlyTotal,
      topCompanies,
      averages,
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
