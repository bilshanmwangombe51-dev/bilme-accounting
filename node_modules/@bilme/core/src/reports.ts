import type { Account, JournalEntry } from "./types.js";
import { accountBalances } from "./ledger.js";
export interface TrialBalanceRow { code: string; name: string; type: string; debit: number; credit: number; }
export interface TrialBalance { rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number; balanced: boolean; }
export function trialBalance(entries: JournalEntry[], accounts: Account[]): TrialBalance {
  const balances = accountBalances(entries, accounts);
  const byId = new Map(accounts.map((a) => [a.id, a]));
  let totalDebit = 0, totalCredit = 0; const rows: TrialBalanceRow[] = [];
  for (const b of balances) {
    const acct = byId.get(b.accountId)!;
    const net = b.debit - b.credit; const debit = net > 0 ? net : 0; const credit = net < 0 ? -net : 0;
    totalDebit += debit; totalCredit += credit;
    rows.push({ code: acct.code, name: acct.name, type: acct.type, debit, credit });
  }
  rows.sort((a, b) => a.code.localeCompare(b.code));
  return { rows, totalDebit, totalCredit, balanced: totalDebit === totalCredit };
}
