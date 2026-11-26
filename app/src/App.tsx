import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Account, type Invoice, type Bill, type Contact } from './db';
import { supabase, pushToCloud, pullFromCloud } from './sync';
import type { User } from '@supabase/supabase-js';

type View = 'dashboard' | 'accounts' | 'contacts' | 'journal' | 'ledger' | 'invoices' | 'bills' | 'trial-balance' | 'profit-loss' | 'balance-sheet' | 'sync';

export default function App() {
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session?.user || null); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session?.user || null); });
    return () => subscription.unsubscribe();
  }, []);
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading BILME...</div>;
  if (!session) return <Login />;
  return <MainApp user={session} />;
}

function Login() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); const [error, setError] = useState(''); const [msg, setMsg] = useState('');
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setMsg('');
    if (isSignUp) { const { error } = await supabase.auth.signUp({ email, password }); if (error) setError(error.message); else setMsg('Check email.'); }
    else { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setError(error.message); }
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f4f8', fontFamily: '"Segoe UI", Roboto, sans-serif' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', width: '380px', borderTop: '4px solid #0077c5' }}>
        <h2 style={{ textAlign: 'center', color: '#393a3d', marginBottom: '1.5rem' }}>BILME Accounting</h2>
        {error && <div style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{error}</div>}
        {msg && <div style={{ color: 'green', fontSize: '14px', marginBottom: '10px' }}>{msg}</div>}
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '10px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '10px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }} />
          <button type="submit" style={{ padding: '10px', background: '#0077c5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>{isSignUp ? 'Sign Up' : 'Log In'}</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '14px', cursor: 'pointer', color: '#0077c5' }} onClick={() => setIsSignUp(!isSignUp)}>{isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}</p>
      </div>
    </div>
  );
}

function MainApp({ user }: { user: User }) {
  const [activeView, setActiveView] = useState<View>('dashboard');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: '"Segoe UI", Roboto, sans-serif', backgroundColor: '#f4f5f8' }}>
      <header style={{ backgroundColor: '#2c3e50', color: 'white', display: 'flex', alignItems: 'center', padding: '0 1.5rem', height: '50px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', zIndex: 10 }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', marginRight: '2rem', letterSpacing: '0.5px' }}>BILME</h1>
        <nav style={{ display: 'flex', gap: '15px', flex: 1 }}>
          <span onClick={() => setActiveView('dashboard')} style={{ cursor: 'pointer', fontWeight: activeView === 'dashboard' ? 'bold' : 'normal', fontSize: '14px', color: '#d1d5db' }}>Dashboard</span>
          <span onClick={() => setActiveView('accounts')} style={{ cursor: 'pointer', fontWeight: activeView === 'accounts' ? 'bold' : 'normal', fontSize: '14px', color: '#d1d5db' }}>Chart of Accounts</span>
          <span onClick={() => setActiveView('contacts')} style={{ cursor: 'pointer', fontWeight: activeView === 'contacts' ? 'bold' : 'normal', fontSize: '14px', color: '#d1d5db' }}>Contacts</span>
          <span onClick={() => setActiveView('invoices')} style={{ cursor: 'pointer', fontWeight: activeView === 'invoices' ? 'bold' : 'normal', fontSize: '14px', color: '#d1d5db' }}>Invoices</span>
          <span onClick={() => setActiveView('bills')} style={{ cursor: 'pointer', fontWeight: activeView === 'bills' ? 'bold' : 'normal', fontSize: '14px', color: '#d1d5db' }}>Bills</span>
          <span onClick={() => setActiveView('journal')} style={{ cursor: 'pointer', fontWeight: activeView === 'journal' ? 'bold' : 'normal', fontSize: '14px', color: '#d1d5db' }}>Journal</span>
          <span onClick={() => setActiveView('ledger')} style={{ cursor: 'pointer', fontWeight: activeView === 'ledger' ? 'bold' : 'normal', fontSize: '14px', color: '#d1d5db' }}>Ledger</span>
          <span style={{ color: '#6b7280' }}>|</span>
          <span onClick={() => setActiveView('trial-balance')} style={{ cursor: 'pointer', fontWeight: activeView === 'trial-balance' ? 'bold' : 'normal', fontSize: '14px', color: '#d1d5db' }}>Trial Balance</span>
          <span onClick={() => setActiveView('profit-loss')} style={{ cursor: 'pointer', fontWeight: activeView === 'profit-loss' ? 'bold' : 'normal', fontSize: '14px', color: '#d1d5db' }}>P&L</span>
          <span onClick={() => setActiveView('balance-sheet')} style={{ cursor: 'pointer', fontWeight: activeView === 'balance-sheet' ? 'bold' : 'normal', fontSize: '14px', color: '#d1d5db' }}>Balance Sheet</span>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{user.email}</span>
          <span onClick={() => setActiveView('sync')} style={{ cursor: 'pointer', fontSize: '12px', color: '#60a5fa', textDecoration: 'underline' }}>Sync</span>
          <button onClick={() => supabase.auth.signOut()} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Log Out</button>
        </div>
      </header>
      <div style={{ padding: '2rem', flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {activeView === 'dashboard' && <Dashboard setView={setActiveView} />}
        {activeView === 'accounts' && <Accounts />}
        {activeView === 'contacts' && <Contacts />}
        {activeView === 'journal' && <Journal />}
        {activeView === 'invoices' && <Invoices />}
        {activeView === 'bills' && <Bills />}
        {activeView === 'ledger' && <Ledger />}
        {activeView === 'trial-balance' && <TrialBalance />}
        {activeView === 'profit-loss' && <ProfitLoss />}
        {activeView === 'balance-sheet' && <BalanceSheet />}
        {activeView === 'sync' && <Sync />}
      </div>
    </div>
  );
}

function Dashboard({ setView }: { setView: (v: View) => void }) {
  const accounts = useLiveQuery(() => db.accounts.toArray()); const entries = useLiveQuery(() => db.entries.toArray());
  if (!accounts || !entries) return <p>Loading...</p>;
  let totalIncome = 0, totalExpense = 0;
  accounts.forEach(acc => { let debit = 0, credit = 0; entries.forEach(e => e.lines.forEach(l => { if (l.accountId === acc.id) { debit += l.debit; credit += l.credit; } })); if (acc.type === 'income') totalIncome += (credit - debit); if (acc.type === 'expense') totalExpense += (debit - credit); });
  const netIncome = totalIncome - totalExpense;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}><h2 style={{ margin: 0, color: '#393a3d', fontSize: '24px' }}>Business Overview</h2></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '4px', border: '1px solid #d4d7dc', borderTop: '3px solid #2ca01c' }}><h3 style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 'normal' }}>Net Income</h3><p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#393a3d' }}>${(netIncome / 100).toFixed(2)}</p></div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '4px', border: '1px solid #d4d7dc', borderTop: '3px solid #0077c5' }}><h3 style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 'normal' }}>Total Income</h3><p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#393a3d' }}>${(totalIncome / 100).toFixed(2)}</p></div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '4px', border: '1px solid #d4d7dc', borderTop: '3px solid #d52b1e' }}><h3 style={{ margin: 0, color: '#6b7280', fontSize: '14px', fontWeight: 'normal' }}>Total Expenses</h3><p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: '#393a3d' }}>${(totalExpense / 100).toFixed(2)}</p></div>
      </div>
    </div>
  );
}

function Accounts() {
  const accounts = useLiveQuery(() => db.accounts.toArray()); const [form, setForm] = useState({ code: '', name: '', type: 'asset' as Account['type'] });
  const addAccount = async (e: React.FormEvent) => { e.preventDefault(); await db.accounts.add(form); setForm({ code: '', name: '', type: 'asset' }); };
  return (
    <div>
      <h2 style={{ color: '#393a3d', marginBottom: '1.5rem' }}>Chart of Accounts</h2>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '4px', border: '1px solid #d4d7dc', marginBottom: '1.5rem' }}>
        <form onSubmit={addAccount} style={{ display: 'flex', gap: '10px' }}>
          <input placeholder="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required style={{ padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', width: '150px', fontSize: '14px' }} />
          <input placeholder="Account Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', flex: 1, fontSize: '14px' }} />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Account['type'] })} style={{ padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }}><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="income">Income</option><option value="expense">Expense</option></select>
          <button type="submit" style={{ padding: '8px 20px', background: '#0077c5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Add</button>
        </form>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #d4d7dc', fontSize: '14px' }}>
        <thead style={{ background: '#f9fafb' }}><tr><th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Code</th><th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Account Name</th><th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Type</th></tr></thead>
        <tbody>{accounts?.map((acc, i) => (<tr key={acc.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '10px', fontWeight: 'bold' }}>{acc.code}</td><td style={{ padding: '10px' }}>{acc.name}</td><td style={{ padding: '10px', textTransform: 'capitalize' }}>{acc.type}</td></tr>))}</tbody>
      </table>
    </div>
  );
}

function Contacts() {
  const contacts = useLiveQuery(() => db.contacts.toArray()); const [form, setForm] = useState({ name: '', email: '', type: 'customer' as Contact['type'] });
  const addContact = async (e: React.FormEvent) => { e.preventDefault(); await db.contacts.add(form); setForm({ name: '', email: '', type: 'customer' }); };
  return (
    <div>
      <h2 style={{ color: '#393a3d', marginBottom: '1.5rem' }}>Contacts</h2>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '4px', border: '1px solid #d4d7dc', marginBottom: '1.5rem' }}>
        <form onSubmit={addContact} style={{ display: 'flex', gap: '10px' }}>
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', flex: 1, fontSize: '14px' }} />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={{ padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', flex: 1, fontSize: '14px' }} />
          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as Contact['type'] })} style={{ padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }}><option value="customer">Customer</option><option value="vendor">Vendor</option></select>
          <button type="submit" style={{ padding: '8px 20px', background: '#0077c5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Add</button>
        </form>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #d4d7dc', fontSize: '14px' }}>
        <thead style={{ background: '#f9fafb' }}><tr><th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Name</th><th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Email</th><th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Type</th></tr></thead>
        <tbody>{contacts?.map((c, i) => (<tr key={c.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '10px', fontWeight: 'bold' }}>{c.name}</td><td style={{ padding: '10px' }}>{c.email}</td><td style={{ padding: '10px', textTransform: 'capitalize' }}>{c.type}</td></tr>))}</tbody>
      </table>
    </div>
  );
}

function Invoices() {
  const accounts = useLiveQuery(() => db.accounts.toArray());
  const contacts = useLiveQuery(() => db.contacts.where('type').equals('customer').toArray());
  const invoices = useLiveQuery(() => db.invoices.reverse().toArray());

  const [contactId, setContactId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('KES');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [incomeAccountId, setIncomeAccountId] = useState('');
  const [arAccountId, setArAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!accounts || !contacts) return <p>Loading Invoice Data...</p>;

  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault(); if (!incomeAccountId || !arAccountId) return alert("Select Income and A/R accounts.");

    const amountCents = Number(amount) * 100;
    const rate = Number(exchangeRate) || 1;
    const baseAmountCents = Math.round(amountCents * rate);

    await db.invoices.add({
      contactId: Number(contactId),
      date,
      amount: amountCents,
      currency,
      exchangeRate: rate,
      status: 'Unpaid',
      incomeAccountId: Number(incomeAccountId)
    });

    await db.entries.add({
      date,
      memo: `Invoice (${currency} ${amount}) created for ${contacts.find(c => c.id === Number(contactId))?.name}`,
      lines: [
        { accountId: Number(arAccountId), debit: baseAmountCents, credit: 0 },
        { accountId: Number(incomeAccountId), debit: 0, credit: baseAmountCents }
      ]
    });

    alert(`Invoice created! Posted to Ledger as KES ${(baseAmountCents / 100).toFixed(2)}`);
    setAmount(''); setExchangeRate('1');
  };

  const markAsPaid = async (inv: Invoice) => {
    const cashAccount = accounts.find(a => a.type === 'asset' && a.id !== Number(arAccountId));
    if (!cashAccount) return alert("Please create a Cash/Bank account.");

    const baseAmountCents = Math.round(inv.amount * inv.exchangeRate);

    await db.invoices.update(inv.id!, { status: 'Paid' });
    await db.entries.add({
      date: new Date().toISOString().split('T')[0],
      memo: `Payment received for Invoice`,
      lines: [
        { accountId: cashAccount.id!, debit: baseAmountCents, credit: 0 },
        { accountId: Number(arAccountId) || cashAccount.id!, debit: 0, credit: baseAmountCents }
      ]
    });
    alert("Invoice marked as Paid!");
  };

  return (
    <div>
      <h2 style={{ color: '#393a3d', marginBottom: '1.5rem' }}>Invoices (A/R) - Multi-Currency</h2>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '4px', border: '1px solid #d4d7dc', marginBottom: '2rem' }}>
        <form onSubmit={createInvoice} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1.5fr', gap: '10px', alignItems: 'end' }}>
          <div><label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Customer</label><select value={contactId} onChange={e => setContactId(e.target.value)} required style={{ width: '100%', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }}><option value="">Select...</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Amount</label><input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required style={{ width: '100%', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }} /></div>
          <div><label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Currency</label><select value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }}><option value="KES">KES</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option></select></div>
          <div><label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Exchange Rate</label><input type="number" step="0.01" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} required placeholder="e.g. 150" style={{ width: '100%', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }} /></div>
          <div><label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Income Account</label><select value={incomeAccountId} onChange={e => setIncomeAccountId(e.target.value)} required style={{ width: '100%', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }}><option value="">Select...</option>{accounts.filter(a => a.type === 'income').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <div><label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>A/R Account</label><select value={arAccountId} onChange={e => setArAccountId(e.target.value)} required style={{ width: '100%', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }}><option value="">Select...</option>{accounts.filter(a => a.type === 'asset').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <button type="submit" style={{ padding: '9px', background: '#0077c5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', gridColumn: 'span 6' }}>Save Invoice & Post to Ledger (in KES)</button>
        </form>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #d4d7dc', fontSize: '14px' }}>
        <thead style={{ background: '#f9fafb' }}><tr><th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Date</th><th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Customer</th><th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Foreign Amount</th><th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Base Amount (KES)</th><th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Status</th><th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Action</th></tr></thead>
        <tbody>{invoices?.map((inv, i) => {
          const baseAmount = inv.amount * inv.exchangeRate;
          return (<tr key={inv.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '10px' }}>{inv.date}</td><td style={{ padding: '10px', fontWeight: 'bold' }}>{contacts.find(c => c.id === inv.contactId)?.name || 'Unknown'}</td><td style={{ padding: '10px', textAlign: 'right' }}>{inv.currency} {(inv.amount / 100).toFixed(2)}</td><td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#0077c5' }}>KES {(baseAmount / 100).toFixed(2)}</td><td style={{ padding: '10px', textAlign: 'center' }}><span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: inv.status === 'Paid' ? '#dcfce7' : '#fee2e2', color: inv.status === 'Paid' ? '#166534' : '#991b1b' }}>{inv.status}</span></td><td style={{ padding: '10px', textAlign: 'center' }}>{inv.status === 'Unpaid' && <button onClick={() => markAsPaid(inv)} style={{ padding: '4px 12px', background: '#2ca01c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Mark Paid</button>}</td></tr>);
        })}</tbody>
      </table>
    </div>
  );
}

function Bills() {
  const accounts = useLiveQuery(() => db.accounts.toArray());
  const contacts = useLiveQuery(() => db.contacts.where('type').equals('vendor').toArray());
  const bills = useLiveQuery(() => db.bills.reverse().toArray());

  const [contactId, setContactId] = useState(''); const [amount, setAmount] = useState(''); const [currency, setCurrency] = useState('KES'); const [exchangeRate, setExchangeRate] = useState('1'); const [expenseAccountId, setExpenseAccountId] = useState(''); const [apAccountId, setApAccountId] = useState(''); const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!accounts || !contacts) return <p>Loading Bill Data...</p>;

  const createBill = async (e: React.FormEvent) => {
    e.preventDefault(); if (!expenseAccountId || !apAccountId) return alert("Select Expense and A/P accounts.");
    const amountCents = Number(amount) * 100;
    const rate = Number(exchangeRate) || 1;
    const baseAmountCents = Math.round(amountCents * rate);

    await db.bills.add({ contactId: Number(contactId), date, amount: amountCents, currency, exchangeRate: rate, status: 'Unpaid', expenseAccountId: Number(expenseAccountId) });
    await db.entries.add({ date, memo: `Bill (${currency} ${amount}) entered for ${contacts.find(c => c.id === Number(contactId))?.name}`, lines: [{ accountId: Number(expenseAccountId), debit: baseAmountCents, credit: 0 }, { accountId: Number(apAccountId), debit: 0, credit: baseAmountCents }] });
    alert("Bill created!"); setAmount(''); setExchangeRate('1');
  };

  const markAsPaid = async (bill: Bill) => {
    const cashAccount = accounts.find(a => a.type === 'asset' && a.id !== Number(apAccountId));
    if (!cashAccount) return alert("Please create a Cash/Bank account.");
    const baseAmountCents = Math.round(bill.amount * bill.exchangeRate);

    await db.bills.update(bill.id!, { status: 'Paid' });
    await db.entries.add({ date: new Date().toISOString().split('T')[0], memo: `Payment made for Bill`, lines: [{ accountId: Number(apAccountId) || cashAccount.id!, debit: baseAmountCents, credit: 0 }, { accountId: cashAccount.id!, debit: 0, credit: baseAmountCents }] });
    alert("Bill marked as Paid!");
  };

  return (
    <div>
      <h2 style={{ color: '#393a3d', marginBottom: '1.5rem' }}>Bills (A/P) - Multi-Currency</h2>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '4px', border: '1px solid #d4d7dc', marginBottom: '2rem' }}>
        <form onSubmit={createBill} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr 1.5fr', gap: '10px', alignItems: 'end' }}>
          <div><label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Vendor</label><select value={contactId} onChange={e => setContactId(e.target.value)} required style={{ width: '100%', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }}><option value="">Select...</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Amount</label><input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required style={{ width: '100%', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }} /></div>
          <div><label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Currency</label><select value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }}><option value="KES">KES</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option></select></div>
          <div><label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Exchange Rate</label><input type="number" step="0.01" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} required placeholder="e.g. 150" style={{ width: '100%', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }} /></div>
          <div><label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Expense Account</label><select value={expenseAccountId} onChange={e => setExpenseAccountId(e.target.value)} required style={{ width: '100%', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }}><option value="">Select...</option>{accounts.filter(a => a.type === 'expense').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <div><label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>A/P Account</label><select value={apAccountId} onChange={e => setApAccountId(e.target.value)} required style={{ width: '100%', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }}><option value="">Select...</option>{accounts.filter(a => a.type === 'liability').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <button type="submit" style={{ padding: '9px', background: '#0077c5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', gridColumn: 'span 6' }}>Save Bill & Post to Ledger (in KES)</button>
        </form>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #d4d7dc', fontSize: '14px' }}>
        <thead style={{ background: '#f9fafb' }}><tr><th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Date</th><th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Vendor</th><th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Foreign Amount</th><th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Base Amount (KES)</th><th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Status</th><th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Action</th></tr></thead>
        <tbody>{bills?.map((bill, i) => {
          const baseAmount = bill.amount * bill.exchangeRate;
          return (<tr key={bill.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '10px' }}>{bill.date}</td><td style={{ padding: '10px', fontWeight: 'bold' }}>{contacts.find(c => c.id === bill.contactId)?.name || 'Unknown'}</td><td style={{ padding: '10px', textAlign: 'right' }}>{bill.currency} {(bill.amount / 100).toFixed(2)}</td><td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#0077c5' }}>KES {(baseAmount / 100).toFixed(2)}</td><td style={{ padding: '10px', textAlign: 'center' }}><span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: bill.status === 'Paid' ? '#dcfce7' : '#fee2e2', color: bill.status === 'Paid' ? '#166534' : '#991b1b' }}>{bill.status}</span></td><td style={{ padding: '10px', textAlign: 'center' }}>{bill.status === 'Unpaid' && <button onClick={() => markAsPaid(bill)} style={{ padding: '4px 12px', background: '#2ca01c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Mark Paid</button>}</td></tr>);
        })}</tbody>
      </table>
    </div>
  );
}

function Journal() {
  const accounts = useLiveQuery(() => db.accounts.toArray()); const [date, setDate] = useState(new Date().toISOString().split('T')[0]); const [memo, setMemo] = useState(''); const [lines, setLines] = useState([{ accountId: '', debit: '', credit: '' }, { accountId: '', debit: '', credit: '' }]);
  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0); const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0); const isBalanced = totalDebit === totalCredit && totalDebit > 0;
  const updateLine = (i: number, field: string, val: string) => { const newLines = [...lines]; (newLines[i] as any)[field] = val; if (field === 'debit' && val) (newLines[i] as any).credit = ''; if (field === 'credit' && val) (newLines[i] as any).debit = ''; setLines(newLines); };
  const save = async (e: React.FormEvent) => { e.preventDefault(); if (!isBalanced) return; await db.entries.add({ date, memo, lines: lines.filter(l => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0)).map(l => ({ accountId: Number(l.accountId), debit: Number(l.debit) * 100 || 0, credit: Number(l.credit) * 100 || 0 })) }); setMemo(''); setLines([{ accountId: '', debit: '', credit: '' }, { accountId: '', debit: '', credit: '' }]); };
  return (
    <div>
      <h2 style={{ color: '#393a3d', marginBottom: '1.5rem' }}>New Journal Entry</h2>
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '4px', border: '1px solid #d4d7dc' }}>
        <form onSubmit={save}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem' }}>
            <div><label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }} /></div>
            <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Memo</label><input placeholder="e.g. Paid Rent" value={memo} onChange={e => setMemo(e.target.value)} required style={{ width: '100%', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px', fontSize: '14px' }} /></div>
          </div>
          <table style={{ width: '100%', marginBottom: '1rem', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead><tr style={{ borderBottom: '2px solid #d4d7dc' }}><th style={{ textAlign: 'left', padding: '8px', color: '#6b7280' }}>Account</th><th style={{ textAlign: 'right', padding: '8px', color: '#6b7280', width: '150px' }}>Debit</th><th style={{ textAlign: 'right', padding: '8px', color: '#6b7280', width: '150px' }}>Credit</th></tr></thead>
            <tbody>{lines.map((line, i) => (<tr key={i}><td style={{ padding: '8px' }}><select value={line.accountId} onChange={e => updateLine(i, 'accountId', e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px' }}><option value="">-- Select Account --</option>{accounts?.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}</select></td><td style={{ padding: '8px' }}><input type="number" step="0.01" value={line.debit} onChange={e => updateLine(i, 'debit', e.target.value)} style={{ width: '100%', textAlign: 'right', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px' }} /></td><td style={{ padding: '8px' }}><input type="number" step="0.01" value={line.credit} onChange={e => updateLine(i, 'credit', e.target.value)} style={{ width: '100%', textAlign: 'right', padding: '8px', border: '1px solid #8d9096', borderRadius: '4px' }} /></td></tr>))}</tbody>
            <tfoot><tr style={{ fontWeight: 'bold', background: '#f9fafb', borderTop: '2px solid #d4d7dc' }}><td style={{ padding: '12px' }}>Totals</td><td style={{ textAlign: 'right', padding: '12px' }}>${totalDebit.toFixed(2)}</td><td style={{ textAlign: 'right', padding: '12px' }}>${totalCredit.toFixed(2)}</td></tr></tfoot>
          </table>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}><button type="submit" disabled={!isBalanced} style={{ padding: '10px 24px', background: isBalanced ? '#2ca01c' : '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', cursor: isBalanced ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '14px' }}>Save Entry</button></div>
        </form>
      </div>
    </div>
  );
}

function Ledger() {
  const accounts = useLiveQuery(() => db.accounts.toArray()); const entries = useLiveQuery(() => db.entries.toArray());
  if (!accounts || !entries) return <p>Loading Ledger...</p>;
  return (
    <div>
      <h2 style={{ color: '#393a3d', marginBottom: '1.5rem' }}>General Ledger (Base Currency: KES)</h2>
      {accounts.map(acc => {
        const accountLines: any[] = [];
        entries.forEach(entry => { entry.lines.forEach(line => { if (line.accountId === acc.id) { accountLines.push({ date: entry.date, memo: entry.memo, debit: line.debit, credit: line.credit }); } }); });
        if (accountLines.length === 0) return null;
        let runningBalance = 0;
        const linesWithBalance = accountLines.map(line => { runningBalance += (line.debit - line.credit); return { ...line, balance: runningBalance }; });
        return (
          <div key={acc.id} style={{ background: 'white', border: '1px solid #d4d7dc', marginBottom: '1.5rem' }}>
            <div style={{ background: '#f9fafb', padding: '12px 15px', borderBottom: '1px solid #d4d7dc' }}><h3 style={{ margin: 0, color: '#393a3d', fontSize: '16px' }}>{acc.code} - {acc.name}</h3></div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead><tr style={{ background: '#ffffff', borderBottom: '1px solid #d4d7dc' }}><th style={{ textAlign: 'left', padding: '10px', color: '#6b7280' }}>Date</th><th style={{ textAlign: 'left', padding: '10px', color: '#6b7280' }}>Memo</th><th style={{ textAlign: 'right', padding: '10px', color: '#6b7280' }}>Debit</th><th style={{ textAlign: 'right', padding: '10px', color: '#6b7280' }}>Credit</th><th style={{ textAlign: 'right', padding: '10px', color: '#6b7280' }}>Balance</th></tr></thead>
              <tbody>{linesWithBalance.map((l, i) => (<tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '10px' }}>{l.date}</td><td style={{ padding: '10px' }}>{l.memo}</td><td style={{ textAlign: 'right', padding: '10px' }}>{l.debit > 0 ? `KES ${(l.debit / 100).toFixed(2)}` : ''}</td><td style={{ textAlign: 'right', padding: '10px' }}>{l.credit > 0 ? `KES ${(l.credit / 100).toFixed(2)}` : ''}</td><td style={{ textAlign: 'right', padding: '10px', fontWeight: 'bold' }}>KES {(l.balance / 100).toFixed(2)}</td></tr>))}</tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

function TrialBalance() {
  const accounts = useLiveQuery(() => db.accounts.toArray()); const entries = useLiveQuery(() => db.entries.toArray());
  if (!accounts || !entries) return <p>Loading...</p>;
  const balances = accounts.map(acc => { let debit = 0, credit = 0; entries.forEach(e => e.lines.forEach(l => { if (l.accountId === acc.id) { debit += l.debit; credit += l.credit; } })); return { ...acc, net: debit - credit }; }).filter(a => a.net !== 0);
  const totalDebit = balances.reduce((s, b) => s + (b.net > 0 ? b.net : 0), 0); const totalCredit = balances.reduce((s, b) => s + (b.net < 0 ? Math.abs(b.net) : 0), 0);
  return (
    <div>
      <h2 style={{ color: '#393a3d', marginBottom: '1.5rem' }}>Trial Balance (KES)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #d4d7dc', fontSize: '14px' }}>
        <thead style={{ background: '#f9fafb' }}><tr><th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Account</th><th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Debit</th><th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #d4d7dc', color: '#6b7280' }}>Credit</th></tr></thead>
        <tbody>{balances.map((b, i) => (<tr key={b.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}><td style={{ padding: '10px' }}>{b.code} - {b.name}</td><td style={{ padding: '10px', textAlign: 'right' }}>{b.net > 0 ? `KES ${(b.net / 100).toFixed(2)}` : ''}</td><td style={{ padding: '10px', textAlign: 'right' }}>{b.net < 0 ? `KES ${(Math.abs(b.net) / 100).toFixed(2)}` : ''}</td></tr>))}</tbody>
        <tfoot style={{ background: '#f4f5f8', fontWeight: 'bold', borderTop: '2px solid #d4d7dc' }}><tr><td style={{ padding: '12px' }}>Total</td><td style={{ padding: '12px', textAlign: 'right' }}>KES {(totalDebit / 100).toFixed(2)}</td><td style={{ padding: '12px', textAlign: 'right' }}>KES {(totalCredit / 100).toFixed(2)}</td></tr></tfoot>
      </table>
    </div>
  );
}

function ProfitLoss() {
  const accounts = useLiveQuery(() => db.accounts.toArray()); const entries = useLiveQuery(() => db.entries.toArray());
  if (!accounts || !entries) return <p>Loading...</p>;
  let totalIncome = 0, totalExpense = 0; const incomeAccounts: any[] = [], expenseAccounts: any[] = [];
  accounts.forEach(acc => { let debit = 0, credit = 0; entries.forEach(e => e.lines.forEach(l => { if (l.accountId === acc.id) { debit += l.debit; credit += l.credit; } })); if (acc.type === 'income') { const bal = credit - debit; totalIncome += bal; if (bal !== 0) incomeAccounts.push({ ...acc, balance: bal }); } else if (acc.type === 'expense') { const bal = debit - credit; totalExpense += bal; if (bal !== 0) expenseAccounts.push({ ...acc, balance: bal }); } });
  const netIncome = totalIncome - totalExpense;
  return (
    <div>
      <h2 style={{ color: '#393a3d', marginBottom: '1.5rem' }}>Profit & Loss (KES)</h2>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '4px', border: '1px solid #d4d7dc', fontSize: '14px' }}>
        <h3 style={{ color: '#2ca01c', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginTop: 0 }}>Income</h3>
        {incomeAccounts.map(a => (<div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>{a.name}</span><span>KES {(a.balance / 100).toFixed(2)}</span></div>))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '8px' }}><span>Total Income</span><span>KES {(totalIncome / 100).toFixed(2)}</span></div>
        <h3 style={{ color: '#d52b1e', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginTop: '2rem' }}>Expenses</h3>
        {expenseAccounts.map(a => (<div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>{a.name}</span><span>KES {(a.balance / 100).toFixed(2)}</span></div>))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '8px' }}><span>Total Expenses</span><span>KES {(totalExpense / 100).toFixed(2)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', marginTop: '2rem', backgroundColor: '#f4f5f8', border: '1px solid #d4d7dc', fontWeight: 'bold', fontSize: '16px' }}><span>Net Income</span><span style={{ color: netIncome >= 0 ? '#2ca01c' : '#d52b1e' }}>KES {(netIncome / 100).toFixed(2)}</span></div>
      </div>
    </div>
  );
}

function BalanceSheet() {
  const accounts = useLiveQuery(() => db.accounts.toArray()); const entries = useLiveQuery(() => db.entries.toArray());
  if (!accounts || !entries) return <p>Loading...</p>;
  let totalAssets = 0, totalLiabilities = 0, totalEquity = 0; const assets: any[] = [], liabilities: any[] = [], equity: any[] = [];
  accounts.forEach(acc => { let debit = 0, credit = 0; entries.forEach(e => e.lines.forEach(l => { if (l.accountId === acc.id) { debit += l.debit; credit += l.credit; } })); if (acc.type === 'asset') { const bal = debit - credit; totalAssets += bal; if (bal !== 0) assets.push({ ...acc, balance: bal }); } else if (acc.type === 'liability') { const bal = credit - debit; totalLiabilities += bal; if (bal !== 0) liabilities.push({ ...acc, balance: bal }); } else if (acc.type === 'equity') { const bal = credit - debit; totalEquity += bal; if (bal !== 0) equity.push({ ...acc, balance: bal }); } });
  return (
    <div>
      <h2 style={{ color: '#393a3d', marginBottom: '1.5rem' }}>Balance Sheet (KES)</h2>
      <div style={{ display: 'flex', gap: '2rem', fontSize: '14px' }}>
        <div style={{ flex: 1, background: 'white', padding: '1.5rem', border: '1px solid #d4d7dc' }}>
          <h3 style={{ color: '#0077c5', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginTop: 0 }}>Assets</h3>
          {assets.map(a => (<div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>{a.name}</span><span>KES {(a.balance / 100).toFixed(2)}</span></div>))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '8px' }}><span>Total Assets</span><span>KES {(totalAssets / 100).toFixed(2)}</span></div>
        </div>
        <div style={{ flex: 1, background: 'white', padding: '1.5rem', border: '1px solid #d4d7dc' }}>
          <h3 style={{ color: '#d52b1e', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginTop: 0 }}>Liabilities</h3>
          {liabilities.map(a => (<div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>{a.name}</span><span>KES {(a.balance / 100).toFixed(2)}</span></div>))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '8px' }}><span>Total Liabilities</span><span>KES {(totalLiabilities / 100).toFixed(2)}</span></div>
          <h3 style={{ color: '#6b7280', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginTop: '2rem' }}>Equity</h3>
          {equity.map(a => (<div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span>{a.name}</span><span>KES {(a.balance / 100).toFixed(2)}</span></div>))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '8px' }}><span>Total Equity</span><span>KES {(totalEquity / 100).toFixed(2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '2px solid #d4d7dc', paddingTop: '12px', marginTop: '2rem', fontSize: '16px' }}><span>Total Liabilities & Equity</span><span>KES {((totalLiabilities + totalEquity) / 100).toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}

function Sync() {
  const [loading, setLoading] = useState(false); const [msg, setMsg] = useState('');
  const handlePush = async () => { setLoading(true); setMsg(''); try { const res = await pushToCloud(); setMsg(res); } catch (e: any) { setMsg(e.message); } finally { setLoading(false); } };
  const handlePull = async () => { setLoading(true); setMsg(''); try { const res = await pullFromCloud(); setMsg(res); } catch (e: any) { setMsg(e.message); } finally { setLoading(false); } };
  return (
    <div>
      <h2 style={{ color: '#393a3d', marginBottom: '1.5rem' }}>Cloud Sync</h2>
      <div style={{ background: 'white', padding: '2rem', border: '1px solid #d4d7dc' }}>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '14px' }}>Sync your local offline database with the cloud so you can access it from any device.</p>
        {msg && <div style={{ padding: '12px', marginBottom: '1rem', background: msg.includes('Success') ? '#dcfce7' : '#fee2e2', color: msg.includes('Success') ? '#166534' : '#991b1b', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold' }}>{msg}</div>}
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={handlePush} disabled={loading} style={{ padding: '10px 20px', background: '#0077c5', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '14px' }}>{loading ? 'Syncing...' : 'Push Local to Cloud'}</button>
          <button onClick={handlePull} disabled={loading} style={{ padding: '10px 20px', background: '#2ca01c', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '14px' }}>{loading ? 'Syncing...' : 'Pull Cloud to Local'}</button>
        </div>
      </div>
    </div>
  );
}