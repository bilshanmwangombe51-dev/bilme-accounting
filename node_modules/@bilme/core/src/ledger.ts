import { validateLines, LedgerError } from "./validate.js";
import type { Account, JournalEntry, JournalLine } from "./types.js";
export function createEntry(input: { id: string; date: string; memo: string; lines: JournalLine[]; }): JournalEntry {
  validateLines(input.lines);
  return { id: input.id, date: input.date, memo: input.memo, lines: input.lines, createdAt: new Date().toISOString() };
}
export interface AccountBalance { accountId: string; debit: number; credit: number; balance: number; }
export function accountBalances(entries: JournalEntry[], accounts: Account[]): AccountBalance[] {
  const map = new Map<string, AccountBalance>();
  for (const a of accounts) map.set(a.id, { accountId: a.id, debit: 0, credit: 0, balance: 0 });
  for (const entry of entries) {
    for (const line of entry.lines) {
      const b = map.get(line.accountId);
      if (!b) throw new LedgerError(`Unknown account: ${line.accountId}`);
      b.debit += line.debit; b.credit += line.credit;
    }
  }
  for (const a of accounts) {
    const b = map.get(a.id)!;
    const debitNormal = a.type === "asset" || a.type === "expense";
    b.balance = debitNormal ? b.debit - b.credit : b.credit - b.debit;
  }
  return Array.from(map.values());
}
