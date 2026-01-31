import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, watchlist, InsertWatchlist, chartDrawings, InsertChartDrawing, analysisHistory, InsertAnalysisHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Watchlist helpers
 */
export async function addToWatchlist(userId: string, symbol: string): Promise<{ id: string }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const id = `${userId}-${symbol}-${Date.now()}`;
  const watchlistItem: InsertWatchlist = {
    id,
    userId,
    symbol: symbol.toUpperCase(),
  };

  await db.insert(watchlist).values(watchlistItem);
  return { id };
}

export async function removeFromWatchlist(userId: string, symbol: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(watchlist).where(
    and(
      eq(watchlist.userId, userId),
      eq(watchlist.symbol, symbol.toUpperCase())
    )
  );
}

export async function getUserWatchlist(userId: string) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db
    .select()
    .from(watchlist)
    .where(eq(watchlist.userId, userId))
    .orderBy(desc(watchlist.addedAt));
}

export async function isInWatchlist(userId: string, symbol: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return false;
  }

  const result = await db
    .select()
    .from(watchlist)
    .where(
      and(
        eq(watchlist.userId, userId),
        eq(watchlist.symbol, symbol.toUpperCase())
      )
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Chart drawings helpers
 */
export async function saveChartDrawings(userId: string, symbol: string, drawings: any[]): Promise<{ id: string }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const id = `${userId}-${symbol.toUpperCase()}`;
  const drawingData = JSON.stringify(drawings);

  // Upsert: insert or update if exists
  await db.insert(chartDrawings).values({
    id,
    userId,
    symbol: symbol.toUpperCase(),
    drawingData,
    updatedAt: new Date(),
  }).onDuplicateKeyUpdate({
    set: {
      drawingData,
      updatedAt: new Date(),
    },
  });

  return { id };
}

export async function getChartDrawings(userId: string, symbol: string): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const result = await db
    .select()
    .from(chartDrawings)
    .where(
      and(
        eq(chartDrawings.userId, userId),
        eq(chartDrawings.symbol, symbol.toUpperCase())
      )
    )
    .limit(1);

  if (result.length === 0) {
    return [];
  }

  try {
    return JSON.parse(result[0].drawingData);
  } catch (error) {
    console.error("[Database] Failed to parse drawing data:", error);
    return [];
  }
}

export async function deleteChartDrawings(userId: string, symbol: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(chartDrawings).where(
    and(
      eq(chartDrawings.userId, userId),
      eq(chartDrawings.symbol, symbol.toUpperCase())
    )
  );
}

/**
 * Analysis history helpers
 */
export async function saveAnalysisHistory(
  userId: string,
  symbol: string,
  companyName: string | null,
  recommendation: string | null,
  riskLevel: string | null,
  agreement: string | null,
  currentPrice: string | null
): Promise<{ id: string }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const id = `${userId}-${symbol.toUpperCase()}-${Date.now()}`;
  
  const historyItem: InsertAnalysisHistory = {
    id,
    userId,
    symbol: symbol.toUpperCase(),
    companyName,
    recommendation,
    riskLevel,
    agreement,
    currentPrice,
  };

  await db.insert(analysisHistory).values(historyItem);
  return { id };
}

export async function getAnalysisHistory(userId: string, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db
    .select()
    .from(analysisHistory)
    .where(eq(analysisHistory.userId, userId))
    .orderBy(desc(analysisHistory.analyzedAt))
    .limit(limit);
}

export async function deleteAnalysisHistoryItem(userId: string, id: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(analysisHistory).where(
    and(
      eq(analysisHistory.userId, userId),
      eq(analysisHistory.id, id)
    )
  );
}

export async function clearAnalysisHistory(userId: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(analysisHistory).where(eq(analysisHistory.userId, userId));
}
