import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseUploadedFile, FinancialSourceType } from "@/lib/data-importer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const source = (formData.get("source") as FinancialSourceType) || "BANK_STATEMENT";
    const businessIdParam = formData.get("businessId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file was uploaded. Please select a CSV or Excel file." },
        { status: 400 }
      );
    }

    // 1. Validate file format
    const fileName = file.name || "upload.csv";
    const lowerName = fileName.toLowerCase();
    const isCsv = lowerName.endsWith(".csv");
    const isXlsx = lowerName.endsWith(".xlsx");
    const isXls = lowerName.endsWith(".xls");

    if (!isCsv && !isXlsx && !isXls) {
      return NextResponse.json(
        {
          error: `Unsupported file format for "${fileName}". Only .csv, .xlsx, and .xls files are supported.`,
        },
        { status: 400 }
      );
    }

    // 2. Validate file size
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json(
        {
          error: "The uploaded file is empty (0 bytes). Please upload a file containing financial records.",
        },
        { status: 400 }
      );
    }

    const maxSizeBytes = 15 * 1024 * 1024; // 15 MB
    if (buffer.length > maxSizeBytes) {
      return NextResponse.json(
        {
          error: `File size exceeds the 15 MB maximum limit. Current file size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB.`,
        },
        { status: 400 }
      );
    }

    // 3. Identify Business
    let business = businessIdParam
      ? await prisma.business.findUnique({ where: { id: businessIdParam } })
      : await prisma.business.findFirst();

    if (!business) {
      return NextResponse.json(
        { error: "No active business found in the database. Please initialize or log in." },
        { status: 400 }
      );
    }

    // 4. Parse file structure
    let parsedData;
    try {
      parsedData = parseUploadedFile(buffer, fileName, source);
    } catch (parseErr: any) {
      return NextResponse.json(
        {
          error: `Failed to parse file: ${parseErr.message}`,
        },
        { status: 400 }
      );
    }

    // 5. Duplicate file check via SHA-256 hash
    const existingFile = await prisma.importedFile.findFirst({
      where: {
        businessId: business.id,
        fileHash: parsedData.fileHash,
      },
      orderBy: { uploadedAt: "desc" },
    });

    const isDuplicateFile = Boolean(existingFile);

    return NextResponse.json({
      success: true,
      fileName,
      fileSize: buffer.length,
      fileType: isCsv ? "CSV" : isXlsx ? "XLSX" : "XLS",
      fileHash: parsedData.fileHash,
      headers: parsedData.headers,
      totalRows: parsedData.totalRows,
      sampleRows: parsedData.sampleRows,
      allRows: parsedData.allRows,
      suggestedMapping: parsedData.suggestedMapping,
      isDuplicateFile,
      existingFileDetails: existingFile
        ? {
            fileName: existingFile.fileName,
            uploadedAt: existingFile.uploadedAt,
            rowCount: existingFile.rowCount,
          }
        : null,
    });
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred while processing the file." },
      { status: 500 }
    );
  }
}

