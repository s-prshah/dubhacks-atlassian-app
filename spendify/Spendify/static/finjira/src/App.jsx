import React, { useEffect, useState } from 'react';
import { view } from '@forge/bridge';
import ExpensePanel from './ExpensePanel.jsx';
import Dashboard from './Dashboard.jsx';

export default function App() {
  const [ctx, setCtx] = useState(null);

  useEffect(() => {
    view.getContext().then(setCtx);
  }, []);

  if (!ctx) return <div>Loading...</div>;

  const extType = ctx?.extension?.type;
  const issueKey = ctx?.extension?.context?.issue?.key;

  return extType === 'jira:issuePanel' ? (
    <ExpensePanel issueKey={issueKey} />
  ) : (
    <Dashboard />
  );
}
