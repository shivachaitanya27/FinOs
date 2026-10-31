import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessIdParam = searchParams.get("businessId");
    const category = searchParams.get("category");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const exportCsv = searchParams.get("export") === "csv";

    let business = null;
    if (businessIdParam) {
      business = await prisma.business.findUnique({ where: { id: businessIdParam } });
    }
    if (!business) {
      const sessionCookie = request.cookies.get("finos_session")?.value;
      if (sessionCookie) {
        try {
          const session = JSON.parse(sessionCookie);
          if (session?.businessId) {
            business = await prisma.business.findUnique({ where: { id: session.businessId } });
          }
        } catch (_) {}
      }
    }
    if (!business) {
      business = (await prisma.business.findFirst({
        where: { transactions: { some: {} } },
        orderBy: { createdAt: "desc" },
      })) || (await prisma.business.findFirst({ orderBy: { createdAt: "desc" } }));
    }

    if (!business) {
      return NextResponse.json({ transactions: [], total: 0, totalPages: 0, page: 1 });
    }

    const where: any = {
      businessId: business.id,
    };

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (source && source !== "ALL") {
      where.source = source;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (search) {
      where.OR = [
        { description: { contains: search } },
        { counterparty: { contains: search } },
        { referenceNumber: { contains: search } },
        { category: { contains: search } },
      ];
    }

    // Handle CSV Export
    if (exportCsv) {
      const allMatching = await prisma.transaction.findMany({
        where,
        include: { account: true },
        orderBy: { [sortBy]: sortOrder },
      });

      const csvRows = [
        [
          "Transaction ID",
          "Date",
          "Description",
          "Category",
          "Transaction Type",
          "Amount (INR)",
          "Account",
          "Source",
          "Reference Number",
          "Counterparty",
          "Import Status",
          "Notes",
        ].join(","),
      ];

      for (const t of allMatching) {
        const row = [
          `"${t.id}"`,
          `"${t.date.toISOString().split("T")[0]}"`,
          `"${(t.description || "").replace(/"/g, '""')}"`,
          `"${(t.category || "").replace(/"/g, '""')}"`,
          `"${t.type}"`,
          t.amount.toFixed(2),
          `"${t.account?.name || "Unassigned"}"`,
          `"${t.source || "MANUAL"}"`,
          `"${t.referenceNumber || ""}"`,
          `"${(t.counterparty || "").replace(/"/g, '""')}"`,
          `"${t.importStatus || "POSTED"}"`,
          `"${(t.notes || "").replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(","));
      }

      const csvContent = csvRows.join("\n");
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="finos_transactions_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // Pagination
    const total = await prisma.transaction.count({ where });
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;

    const transactions = await prisma.transaction.findMany({
      where,
      include: { account: true },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      transactions,
      total,
      totalPages,
      page,
      limit,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      accountId,
      date,
      description,
      amount,
      type,
      category,
      paymentMethod,
      counterparty,
      referenceNumber,
      notes,
      source = "MANUAL",
      classification,
    } = body;

    if (!description || !amount) {
      return NextResponse.json(
        { error: "Description and amount are required." },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a valid positive number." },
        { status: 400 }
      );
    }

    let targetBusinessId = businessId;
    if (!targetBusinessId) {
      const biz = await prisma.business.findFirst();
      if (!biz) {
        return NextResponse.json({ error: "No business found" }, { status: 400 });
      }
      targetBusinessId = biz.id;
    }

    const newTx = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          businessId: targetBusinessId,
          accountId: accountId || null,
          date: date ? new Date(date) : new Date(),
          description: description.trim(),
          amount: numAmount,
          type: type || "EXPENSE",
          category: category || "Miscellaneous",
          paymentMethod: paymentMethod || "UPI",
          counterparty: counterparty?.trim() || null,
          referenceNumber: referenceNumber?.trim() || `TXN-${Date.now().toString().slice(-6)}`,
          notes: notes?.trim() || null,
          source,
          classification: classification || null,
          importStatus: "POSTED",
          status: "COMPLETED",
          isDemo: false,
        },
        include: { account: true },
      });

      // Update account balance if accountId is provided
      if (accountId) {
        const delta = type === "REVENUE" ? numAmount : -numAmount;
        await tx.financialAccount.update({
          where: { id: accountId },
          data: {
            currentBalance: {
              increment: delta,
            },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          businessId: targetBusinessId,
          action: "TRANSACTION_CREATED",
          entityType: "TRANSACTION",
          entityId: created.id,
          details: `Manual transaction created: ₹${numAmount} (${type}) - ${description}`,
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, transaction: newTx });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
