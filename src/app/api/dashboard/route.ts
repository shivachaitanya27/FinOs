import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateFinancialMetrics } from "@/lib/financial-engine";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter") || "this_month";
    const customStart = searchParams.get("startDate");
    const customEnd = searchParams.get("endDate");
    const businessIdParam = searchParams.get("businessId");

    // 1. Identify active business
    let business = businessIdParam
      ? await prisma.business.findUnique({ where: { id: businessIdParam } })
      : await prisma.business.findFirst();

    if (!business) {
      return NextResponse.json({
        hasData: false,
        message: "No business found. Please seed or create a business.",
      });
    }

    const businessId = business.id;

    // 2. Compute date boundaries based on filter
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    switch (filter) {
      case "today": {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      }
      case "7days": {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case "this_month": {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;
      }
      case "last_month": {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      }
      case "3months": {
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1, 0, 0, 0);
        break;
      }
      case "custom": {
        startDate = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = customEnd ? new Date(customEnd) : new Date(now);
        endDate.setHours(23, 59, 59);
        break;
      }
      default: {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      }
    }

    // 3. Current Cash Position: sum of current balance across all business financial accounts
    const financialAccounts = await prisma.financialAccount.findMany({
      where: { businessId },
    });
    const currentCashPosition = financialAccounts.reduce(
      (sum, acc) => sum + (acc.currentBalance || 0),
      0
    );
    const openingCashTotal = financialAccounts.reduce(
      (sum, acc) => sum + (acc.openingBalance || 0),
      0
    );

    // 4. Query all transactions in current filter period
    const periodTransactions = await prisma.transaction.findMany({
      where: {
        businessId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { account: true },
      orderBy: { date: "desc" },
    });

    // 5. Calculate KPI values using Deterministic Financial Engine
    const periodMetrics = calculateFinancialMetrics(periodTransactions, {
      openingCash: currentCashPosition - (periodTransactions.length ? 0 : 0),
      filterCompletedOnly: true,
    });

    const totalRevenue = periodMetrics.totalRevenue;
    const totalExpenses = periodMetrics.totalExpenses;
    const netProfitLoss = periodMetrics.netProfitLoss;
    const hasSufficientData = periodMetrics.hasSufficientData;

    // Outstanding Receivables: pending revenue transactions across all time or period
    const pendingReceivables = await prisma.transaction.aggregate({
      where: {
        businessId,
        type: "REVENUE",
        status: "PENDING",
      },
      _sum: { amount: true },
      _count: { id: true },
    });
    const outstandingReceivables = pendingReceivables._sum.amount || 0;

    // Outstanding Payables: pending expense transactions across all time
    const pendingPayables = await prisma.transaction.aggregate({
      where: {
        businessId,
        type: "EXPENSE",
        status: "PENDING",
      },
      _sum: { amount: true },
      _count: { id: true },
    });
    const outstandingPayables = pendingPayables._sum.amount || 0;

    // 6. Query all historical transactions for monthly trends (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const historicalTransactions = await prisma.transaction.findMany({
      where: {
        businessId,
        status: { in: ["COMPLETED", "RECONCILED"] },
        date: { gte: sixMonthsAgo },
      },
      orderBy: { date: "asc" },
    });

    // Group historical transactions by month
    const monthlyMap = new Map<
      string,
      {
        month: string;
        txs: typeof historicalTransactions;
      }
    >();

    // Seed the last 6 calendar months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      monthlyMap.set(monthKey, {
        month: monthKey,
        txs: [],
      });
    }

    for (const tx of historicalTransactions) {
      const txMonth = tx.date.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (monthlyMap.has(txMonth)) {
        monthlyMap.get(txMonth)!.txs.push(tx);
      }
    }

    const monthlyTrends = Array.from(monthlyMap.values()).map((entry) => {
      const metrics = calculateFinancialMetrics(entry.txs);
      return {
        month: entry.month,
        revenue: metrics.totalRevenue,
        expenses: metrics.totalExpenses,
        net: metrics.netProfitLoss || 0,
        inflow: metrics.cashInflows,
        outflow: metrics.cashOutflows,
      };
    });

    // 7. Expense Category Breakdown for active period (Strictly operating expenses)
    const categoryMap = new Map<string, number>();
    for (const tx of periodTransactions) {
      if (tx.status === "COMPLETED" || tx.status === "RECONCILED") {
        if (tx.type === "EXPENSE" && tx.category !== "Internal Transfer") {
          const cat = tx.category || "Miscellaneous";
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + tx.amount);
        }
      }
    }

    const categoryColors: Record<string, string> = {
      "Payroll & Salaries": "#2563EB", // Blue
      "Cloud & Software": "#0D9488", // Teal
      "Office Rent": "#F59E0B", // Amber
      "Marketing & Growth": "#8B5CF6", // Purple
      "Legal & Accounting": "#EC4899", // Pink
      "Logistics": "#10B981", // Emerald
      "Taxes & Duties": "#EF4444", // Red
      "Miscellaneous": "#64748B", // Slate
    };

    const expenseCategoryBreakdown = Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalExpenses > 0 ? Math.round((value / totalExpenses) * 100) : 0,
        color: categoryColors[name] || "#3B82F6",
      }))
      .sort((a, b) => b.value - a.value);

    // 8. Recent Transactions (latest 10)
    const recentTransactions = await prisma.transaction.findMany({
      where: { businessId },
      include: { account: true },
      orderBy: { date: "desc" },
      take: 10,
    });

    // 9. Financial Health Metrics
    const total3MoExpenses = monthlyTrends.slice(-3).reduce((acc, m) => acc + m.expenses, 0);
    const avgMonthlyExpense = total3MoExpenses > 0 ? total3MoExpenses / 3 : (totalExpenses || 1);
    const runwayMonths = avgMonthlyExpense > 0 ? (currentCashPosition / avgMonthlyExpense).toFixed(1) : "N/A";
    const quickRatio = avgMonthlyExpense > 0 ? (currentCashPosition / (outstandingPayables || avgMonthlyExpense * 0.4)).toFixed(2) : "2.4";
    const grossMargin = totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0;

    let healthScore = 75;
    if (netProfitLoss !== null && netProfitLoss > 0) healthScore += 12;
    if (parseFloat(runwayMonths) >= 6) healthScore += 8;
    if (outstandingPayables < currentCashPosition * 0.3) healthScore += 5;
    healthScore = Math.min(100, Math.max(20, healthScore));

    // 10. Financial Risk Alerts
    const riskAlerts = await prisma.riskAlert.findMany({
      where: { businessId, status: "ACTIVE" },
      orderBy: { severity: "asc" },
      take: 5,
    });

    // 11. AI Recommendations
    const aiRecommendations = await prisma.aIRecommendation.findMany({
      where: { businessId, status: "PENDING" },
      orderBy: { impact: "asc" },
      take: 4,
    });

    return NextResponse.json({
      hasData: true,
      business: {
        id: business.id,
        name: business.name,
        legalName: business.legalName,
        taxId: business.taxId,
        currency: business.currency,
      },
      filter,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      kpis: {
        totalRevenue,
        totalExpenses,
        netProfitLoss,
        hasSufficientData,
        currentCashPosition,
        outstandingReceivables,
        outstandingPayables,
        transactionCount: periodTransactions.length,
        cashInflows: periodMetrics.cashInflows,
        cashOutflows: periodMetrics.cashOutflows,
        netCashFlow: periodMetrics.netCashFlow,
        closingCash: periodMetrics.closingCash,
      },
      charts: {
        revenueVsExpenses: monthlyTrends.map((m) => ({
          name: m.month,
          Revenue: m.revenue,
          Expenses: m.expenses,
        })),
        monthlyTrends,
        expenseCategoryBreakdown,
        cashFlow: monthlyTrends.map((m) => ({
          name: m.month,
          Inflow: m.inflow,
          Outflow: m.outflow,
          Net: m.net,
        })),
      },
      recentTransactions,
      financialHealth: {
        score: healthScore,
        runwayMonths,
        quickRatio,
        grossMargin,
        status: healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Stable" : "Caution",
      },
      riskAlerts,
      aiRecommendations,
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
