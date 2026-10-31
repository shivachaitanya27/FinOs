import { NextRequest, NextResponse } from "next/server";
import { generateFinancialReport, ReportType } from "@/lib/report-engine.ts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = (searchParams.get("type") || "MONTHLY_SUMMARY") as ReportType;
    const period = (searchParams.get("period") || "this_month") as any;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const businessId = searchParams.get("businessId") || undefined;

    const report = await generateFinancialReport(reportType, {
      businessId,
      period,
      startDate,
      endDate,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("GET /api/reports error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}

