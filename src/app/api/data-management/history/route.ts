import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const businessIdParam = searchParams.get("businessId");

    let business = businessIdParam
      ? await prisma.business.findUnique({ where: { id: businessIdParam } })
      : await prisma.business.findFirst();

    if (!business) {
      return NextResponse.json({ history: [], total: 0 });
    }

    const files = await prisma.importedFile.findMany({
      where: { businessId: business.id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { uploadedAt: "desc" },
    });

    // Also get accounts map
    const accounts = await prisma.financialAccount.findMany({
      where: { businessId: business.id },
    });
    const accountMap = new Map(accounts.map((a) => [a.id, a.name]));

    const history = files.map((f) => ({
      id: f.id,
      fileName: f.fileName,
      fileType: f.fileType,
      fileSize: f.fileSize,
      rowCount: f.rowCount,
      validCount: f.validCount,
      invalidCount: f.invalidCount,
      source: f.source,
      status: f.status,
      uploadedAt: f.uploadedAt,
      accountName: f.accountId ? accountMap.get(f.accountId) || "Unassigned" : "Multiple / Default",
      transactionCount: f._count.transactions,
    }));

    return NextResponse.json({ success: true, history, total: history.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get("id");

    if (!fileId) {
      return NextResponse.json({ error: "Missing file ID to delete" }, { status: 400 });
    }

    // Delete associated transactions and the file record
    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: { importedFileId: fileId },
      });
      await tx.importedFile.delete({
        where: { id: fileId },
      });
    });

    return NextResponse.json({ success: true, message: "Import batch and records deleted." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

