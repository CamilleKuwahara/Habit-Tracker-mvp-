import { databases } from "../auth/appwrite.js"; // include .js if Vite complains
import { Permission, Role, Query } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DB_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_FEED_COLLECTION_ID;

if (!DATABASE_ID || !COLLECTION_ID) {
  console.warn("Missing Appwrite IDs. Check .env for DB/Collection IDs.");
}

const docIdFor = (userId, date) => `${userId}_${date}`;

export async function publishDailySummary({
  userId,
  displayName,
  date,
  done,
  total,
  rate,
  shareHabits,
  habitsDone,
}) {
  const documentId = docIdFor(userId, date);

  const data = {
    userId,
    displayName: displayName || "",
    date,
    done,
    total,
    rate,
    shareHabits: !!shareHabits,
    ...(shareHabits ? { habitsDone: habitsDone || [] } : {}),
  };

  const permissions = [
    Permission.read(Role.users()),        // ✅ ONLY LOGGED-IN USERS CAN READ
    Permission.update(Role.user(userId)), // ✅ ONLY AUTHOR CAN UPDATE
    Permission.delete(Role.user(userId)), // ✅ ONLY AUTHOR CAN DELETE
  ];

  try {
    return await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      documentId,
      data,
      permissions
    );
  } catch (e) {
    // 409 = already exists → update instead (idempotent)
    if (e?.code === 409) {
      return await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        documentId,
        data,
        permissions
      );
    }
    throw e;
  }
}

export async function loadFeed({ limit = 50 } = {}) {
  return await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
  ]);
}
