/**
 * db.js
 * MongoDB Connection and Persistence Layer for URL Analyser ML.
 * Connects to MongoDB 8.3 on localhost:27017.
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'linkscope_ml';

let client = null;
let db = null;

export async function connectDb() {
  if (db) return db;

  try {
    client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 4000
    });
    await client.connect();
    db = client.db(DB_NAME);

    // Ensure helpful indexes
    await Promise.all([
      db.collection('training_dataset').createIndex({ url: 1 }),
      db.collection('ml_models').createIndex({ version: 1, isActive: 1 }),
      db.collection('scan_telemetry').createIndex({ scannedAt: -1 })
    ]);

    console.log(`[MongoDB] Connected successfully to "${DB_NAME}" at ${MONGODB_URI}`);
    return db;
  } catch (err) {
    console.warn(`[MongoDB] Could not connect to MongoDB at ${MONGODB_URI}: ${err.message}`);
    return null;
  }
}

export function getDb() {
  return db;
}

export async function saveTrainedModel(modelData) {
  if (!db) await connectDb();
  if (!db) return false;

  // Mark previous models as inactive
  await db.collection('ml_models').updateMany({}, { $set: { isActive: false } });

  const doc = {
    ...modelData,
    isActive: true,
    savedAt: new Date().toISOString()
  };

  const res = await db.collection('ml_models').insertOne(doc);
  return res.insertedId;
}

export async function getActiveModel() {
  if (!db) await connectDb();
  if (!db) return null;

  return await db.collection('ml_models').findOne({ isActive: true });
}

export async function logScanTelemetry(scanRecord) {
  if (!db) await connectDb();
  if (!db) return false;

  try {
    await db.collection('scan_telemetry').insertOne({
      ...scanRecord,
      loggedAt: new Date()
    });
    return true;
  } catch {
    return false;
  }
}
