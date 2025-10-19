import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';

export default function ExpensePanel({ issueKey }) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [note, setNote] = useState('');
  const [expenses, setExpenses] = useState([]);

  const refresh = async () => {
    const all = await invoke('getExpenses');
    setExpenses(all);
  };

  useEffect(() => { refresh(); }, []);

  const save = async () => {
    if (!amount) return;
    await invoke('storeExpense', { amount, category, note, issueKey });
    setAmount(''); setNote('');
    refresh();
  };

  return (
    <div style={{ padding: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h3>Add Expense</h3>
      <div>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>Food</option>
          <option>Rent</option>
          <option>Transport</option>
          <option>Books</option>
          <option>Other</option>
        </select>
        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button onClick={save}>Save</button>
      </div>

      <h4 style={{ marginTop: 16 }}>Expenses</h4>
      <ul>
        {expenses.map((e) => (
          <li key={e.id}>
            ${e.amount} — {e.category} {e.note ? `(${e.note})` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}
