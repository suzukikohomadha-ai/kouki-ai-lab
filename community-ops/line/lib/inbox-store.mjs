// 個別メッセージ下書きの保存先（JSONファイル・外部DB不要）。
// community-ops/line/data/inbox.json に保存する。個人のLINEメッセージ内容を含むため
// Gitには含めない（community-ops/.gitignore で除外済み）。
// 低頻度（個別相談）を前提にした最小実装で、同時書き込みの排他制御は行っていない。
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "data");
const DATA_PATH = join(DATA_DIR, "inbox.json");

function loadAll() {
  if (!existsSync(DATA_PATH)) return [];
  try {
    const raw = readFileSync(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(items) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), "utf-8");
}

export function hasMessage(id) {
  return loadAll().some((item) => item.id === id);
}

// item: { id, userId, displayName, receivedAt, userMessage, draftReply, draftError, status }
export function addInboxItem(item) {
  const items = loadAll();
  if (items.some((existing) => existing.id === item.id)) return; // LINE webhookの再送による二重登録を防ぐ
  items.push(item);
  saveAll(items);
}

export function listPending() {
  return loadAll()
    .filter((item) => item.status === "pending")
    .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
}

export function listHandled(limit = 20) {
  return loadAll()
    .filter((item) => item.status === "handled")
    .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))
    .slice(0, limit);
}

export function markHandled(id) {
  const items = loadAll();
  const target = items.find((item) => item.id === id);
  if (!target) return false;
  target.status = "handled";
  target.handledAt = new Date().toISOString();
  saveAll(items);
  return true;
}
