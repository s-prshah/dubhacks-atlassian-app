import ForgeUI, { render, Fragment, Text, Form, TextField, Button, useState } from '@forge/ui';

// In-memory storage
const entries = [];

const DashboardPanel = () => {
  const totalIncome = entries.filter(e => e.type === 'income').reduce((sum,e)=>sum+e.amount,0);
  const totalExpenses = entries.filter(e => e.type === 'expense').reduce((sum,e)=>sum+e.amount,0);
  const balance = totalIncome - totalExpenses;

  return ForgeUI.createElement(Fragment, null,
    ForgeUI.createElement(Text, { content: "🎓 Spendify — Dashboard" }),
    ForgeUI.createElement(Text, { content: `Total income: $${totalIncome.toFixed(2)} | Total expenses: $${totalExpenses.toFixed(2)} | Balance: $${balance.toFixed(2)}` }),
    ForgeUI.createElement(Text, { content: "Recent entries:" }),
    ...entries.slice(-5).map(e => ForgeUI.createElement(Text, { content: `${e.type.toUpperCase()}: $${e.amount} — ${e.category}` }))
  );
};

const AddPanel = () => {
  const [_, setState] = useState(entries);

  const onSubmit = (formData) => {
    entries.push({ type: formData.type, amount: parseFloat(formData.amount), category: formData.category });
    setState([...entries]);
  };

  return ForgeUI.createElement(Form, { onSubmit },
    ForgeUI.createElement(TextField, { label: "Type (income/expense)", name: "type" }),
    ForgeUI.createElement(TextField, { label: "Amount", name: "amount" }),
    ForgeUI.createElement(TextField, { label: "Category", name: "category" }),
    ForgeUI.createElement(Button, { text: "Add Entry" })
  );
};

const ReportsPanel = () => {
  const totalIncome = entries.filter(e => e.type === 'income').reduce((sum,e)=>sum+e.amount,0);
  const totalExpenses = entries.filter(e => e.type === 'expense').reduce((sum,e)=>sum+e.amount,0);
  const balance = totalIncome - totalExpenses;

  return ForgeUI.createElement(Fragment, null,
    ForgeUI.createElement(Text, { content: "📊 Spendify — Reports" }),
    ForgeUI.createElement(Text, { content: `Total income: $${totalIncome.toFixed(2)}` }),
    ForgeUI.createElement(Text, { content: `Total expenses: $${totalExpenses.toFixed(2)}` }),
    ForgeUI.createElement(Text, { content: `Balance: $${balance.toFixed(2)}` })
  );
};

// Handlers
export const dashboardHandler = () => render(DashboardPanel);
export const addHandler = () => render(AddPanel);
export const reportsHandler = () => render(ReportsPanel);
