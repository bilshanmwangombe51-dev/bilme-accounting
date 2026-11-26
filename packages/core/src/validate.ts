import type { JournalLine } from "./types.js";
export class LedgerError extends Error { constructor(message: string) { super(message); this.name = "LedgerError"; } }
export function validateLines(lines: JournalLine[]): void {
  if (lines.length < 2) throw new LedgerError("A journal entry needs at least 2 lines");
  let debits = 0, credits = 0;
  for (const line of lines) {
    if (!Number.isInteger(line.debit) || !Number.isInteger(line.credit)) throw new LedgerError("Amounts must be integer cents");
    if (line.debit < 0 || line.credit < 0) throw new LedgerError("Amounts cannot be negative");
    if (line.debit > 0 && line.credit > 0) throw new LedgerError("A line cannot have both debit and credit");
    if (line.debit === 0 && line.credit === 0) throw new LedgerError("A line must have either a debit or credit");
    debits += line.debit; credits += line.credit;
  }
  if (debits !== credits) throw new LedgerError(`Unbalanced entry: debits ${debits} ? credits ${credits}`);
}
