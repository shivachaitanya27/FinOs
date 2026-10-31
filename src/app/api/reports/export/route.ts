import { NextRequest, NextResponse } from "next/server";
import { generateFinancialReport, exportReportToExcel, ReportType } from "@/lib/report-engine.ts";

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

    const excelBuffer = exportReportToExcel(report);

    const safeTitle = report.title.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `FinOS_${safeTitle}_${Date.now()}.xlsx`;

    return new Response(excelBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": excelBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("GET /api/reports/export error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to export report" },
      { status: 500 }
    );
  }
}

