import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import { SEED_DB_BASE64 } from "./db-seed-binary.js";

export function isServerlessEnvironment(): boolean {
  return Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.VERCEL_ENV
  );
}

export function ensureDatabaseReady(forceOverwrite = false): string {
  // If explicitly configured with a remote database (PostgreSQL / Supabase / Neon / AWS RDS)
  const currentUrl = process.env.DATABASE_URL || "";
  if (
    currentUrl.startsWith("postgres://") ||
    currentUrl.startsWith("postgresql://") ||
    currentUrl.startsWith("mysql://")
  ) {
    return currentUrl;
  }

  const isServerless = isServerlessEnvironment();

  if (isServerless) {
    const tmpDir = process.env.TEMP || "/tmp";
    const tmpDbPath = path.join(tmpDir, "dev.db");

    // Check if /tmp/dev.db exists and has data
    const needsBootstrap = forceOverwrite || !fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0;

    if (needsBootstrap) {
      let restored = false;

      // 1. Try copying from bundle disk paths
      const potentialBundlePaths = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
        path.join("/var/task", "prisma", "dev.db"),
        path.join("/var/task", "dev.db"),
      ];

      for (const p of potentialBundlePaths) {
        if (fs.existsSync(p)) {
          try {
            fs.copyFileSync(p, tmpDbPath);
            fs.chmodSync(tmpDbPath, 0o666);
            restored = true;
            console.log(`[FinOS] Copied database from ${p} to ${tmpDbPath}`);
            break;
          } catch (copyErr) {
            console.warn(`[FinOS] Could not copy from ${p}:`, copyErr);
          }
        }
      }

      // 2. Unpack embedded base64 database directly to /tmp (guarantees persistence across Vercel cold starts)
      if (!restored && SEED_DB_BASE64) {
        try {
          const buffer = Buffer.from(SEED_DB_BASE64, "base64");
          fs.writeFileSync(tmpDbPath, buffer);
          fs.chmodSync(tmpDbPath, 0o666);
          console.log(`[FinOS] Unpacked embedded seed database to ${tmpDbPath} (${buffer.length} bytes)`);
          restored = true;
        } catch (unpackErr) {
          console.error("[FinOS] Failed to unpack embedded database:", unpackErr);
        }
      }
    }

    const sqliteUrl = `file:${tmpDbPath.replace(/\\/g, "/")}`;
    process.env.DATABASE_URL = sqliteUrl;
    return sqliteUrl;
  }

  // Local development mode
  const localDbUrl = process.env.DATABASE_URL || "file:./dev.db";
  process.env.DATABASE_URL = localDbUrl;

  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, 'DATABASE_URL="file:./dev.db"\nNODE_ENV="development"\n');
    }
  } catch (_) {}

  return localDbUrl;
}

const activeDbUrl = ensureDatabaseReady();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: activeDbUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
