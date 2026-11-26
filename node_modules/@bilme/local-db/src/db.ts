import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { JournalEntry, Account } from "@bilme/core";
const __dirname = dirname(fileURLToPath(import.meta.url));
export class BilmeDB {
  private db: Database.Database;
  constructor(dbPath: string = "bilme-data.sqlite") {
    this.db = new Database(dbPath);
    this.db.pragma("foreign_keys = ON");
    const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
    this.db.exec(schema);
  }
  saveAccount(account: Account) {
    const stmt = this.db.prepare(`INSERT INTO accounts (id, code, name, type) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name`);
    stmt.run(account.id, account.code, account.name, account.type);
  }
  getAccounts(): Account[] { return this.db.prepare("SELECT * FROM accounts").all() as Account[]; }
  saveEntry(entry: JournalEntry) {
    const insertEntry = this.db.prepare(`INSERT INTO journal_entries (id, date, memo, created_at) VALUES (?, ?, ?, ?)`);
    const insertLine = this.db.prepare(`INSERT INTO journal_lines (id, entry_id, account_id, debit, credit) VALUES (?, ?, ?, ?, ?)`);
    const transaction = this.db.transaction(() => {
      insertEntry.run(entry.id, entry.date, entry.memo, entry.createdAt);
      for (let i = 0; i < entry.lines.length; i++) {
        const line = entry.lines[i];
        insertLine.run(`${entry.id}-${i}`, entry.id, line.accountId, line.debit, line.credit);
      }
    });
    transaction();
  }
  getEntries(): JournalEntry[] {
    const entries = this.db.prepare("SELECT * FROM journal_entries").all() as any[];
    return entries.map(e => {
      const lines = this.db.prepare("SELECT * FROM journal_lines WHERE entry_id = ?").all(e.id) as any[];
      return { id: e.id, date: e.date, memo: e.memo, createdAt: e.created_at, lines: lines.map(l => ({ accountId: l.account_id, debit: l.debit, credit: l.credit })) };
    });
  }
}
