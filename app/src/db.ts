import Dexie, { type Table } from 'dexie';

export interface Account { id?: number; code: string; name: string; type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'; }
export interface Contact { id?: number; name: string; email: string; type: 'customer' | 'vendor'; }
export interface JournalLine { accountId: number; debit: number; credit: number; }
export interface JournalEntry { id?: number; date: string; memo: string; lines: JournalLine[]; }

export interface Invoice {
  id?: number;
  contactId: number;
  date: string;
  amount: number; 
  currency: string; 
  exchangeRate: number; 
  status: 'Unpaid' | 'Paid';
  incomeAccountId: number;
}

export interface Bill {
  id?: number;
  contactId: number;
  date: string;
  amount: number;
  currency: string;
  exchangeRate: number;
  status: 'Unpaid' | 'Paid';
  expenseAccountId: number;
}

export class BilmeDatabase extends Dexie {
  accounts!: Table<Account>;
  contacts!: Table<Contact>;
  entries!: Table<JournalEntry>;
  invoices!: Table<Invoice>;
  bills!: Table<Bill>;

  constructor() {
    super('BilmeDB');
    this.version(4).stores({
      accounts: '++id, code, name, type',
      contacts: '++id, name, type',
      entries: '++id, date, memo',
      invoices: '++id, contactId, date, status',
      bills: '++id, contactId, date, status'
    });
  }
}

export const db = new BilmeDatabase();