import { openDB } from 'idb';

let dbInstance;

async function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB('conductos-offline', 1, {
    upgrade(database) {
      database.createObjectStore('pending-messages', { keyPath: 'id' });
      const cases = database.createObjectStore('cached-cases', { keyPath: 'id' });
      cases.createIndex('by-cached-at', 'cachedAt');
      database.createObjectStore('draft-documents', { keyPath: 'id' });
    }
  });
  return dbInstance;
}

export async function savePendingMessage(data) {
  const db = await getDb();
  await db.put('pending-messages', { id: crypto.randomUUID(), data, createdAt: Date.now() });
}

export async function cacheCase(caseData) {
  const db = await getDb();
  await db.put('cached-cases', { id: caseData.id, data: caseData, cachedAt: Date.now() });
}

export async function getCachedCase(id) {
  const db = await getDb();
  const record = await db.get('cached-cases', id);
  return record?.data || null;
}

export async function saveDraft({ caseId, type, content }) {
  const db = await getDb();
  const id = `${caseId}-${type}`;
  await db.put('draft-documents', { id, caseId, type, content, updatedAt: Date.now() });
  return id;
}

export async function getDraft(caseId, type) {
  const db = await getDb();
  const record = await db.get('draft-documents', `${caseId}-${type}`);
  return record?.content || null;
}
