export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";
export interface Account { id: string; code: string; name: string; type: AccountType; }
export interface JournalLine { accountId: string; debit: number; credit: number; }
export interface JournalEntry { id: string; date: string; memo: string; lines: JournalLine[]; createdAt: string; }
