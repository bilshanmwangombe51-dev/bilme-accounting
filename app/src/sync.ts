import { createClient } from '@supabase/supabase-js';
import { db } from './db';

const SUPABASE_URL = 'https://qbhmqjsafxfukepwzcrv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_c14jBEmDFbey_p5yPKq8Mw_6vo42th5';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function pushToCloud() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to sync.");

  const accounts = await db.accounts.toArray();
  if (accounts.length > 0) await supabase.from('accounts').upsert(accounts.map(a => ({ code: a.code, name: a.name, type: a.type, user_id: user.id })), { onConflict: 'code' });

  const contacts = await db.contacts.toArray();
  if (contacts.length > 0) await supabase.from('contacts').upsert(contacts.map(c => ({ name: c.name, email: c.email, type: c.type, user_id: user.id })));

  const entries = await db.entries.toArray();
  if (entries.length > 0) await supabase.from('entries').upsert(entries.map(e => ({ date: e.date, memo: e.memo, lines: e.lines, user_id: user.id })));

  const invoices = await db.invoices.toArray();
  if (invoices.length > 0) await supabase.from('invoices').upsert(invoices.map(i => ({ contact_id: i.contactId, date: i.date, amount: i.amount, status: i.status, user_id: user.id })));

  const bills = await db.bills.toArray();
  if (bills.length > 0) await supabase.from('bills').upsert(bills.map(b => ({ contact_id: b.contactId, date: b.date, amount: b.amount, status: b.status, user_id: user.id })));

  return "Successfully pushed all data to the cloud!";
}

export async function pullFromCloud() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to sync.");

  const { data: cloudAccounts } = await supabase.from('accounts').select('*').eq('user_id', user.id);
  for (const acc of cloudAccounts || []) { if (!(await db.accounts.where('code').equals(acc.code).first())) await db.accounts.add({ code: acc.code, name: acc.name, type: acc.type }); }

  const { data: cloudContacts } = await supabase.from('contacts').select('*').eq('user_id', user.id);
  for (const c of cloudContacts || []) { if (!(await db.contacts.where('name').equals(c.name).first())) await db.contacts.add({ name: c.name, email: c.email, type: c.type }); }

  const { data: cloudEntries } = await supabase.from('entries').select('*').eq('user_id', user.id);
  for (const e of cloudEntries || []) { if (!(await db.entries.where({ date: e.date, memo: e.memo }).first())) await db.entries.add({ date: e.date, memo: e.memo, lines: e.lines }); }

  return "Successfully pulled all data from the cloud!";
}