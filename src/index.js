import api, { route } from '@forge/api';

const addJiraCommentInternal = async (issueId, commentText) => {
  try {
    const bodyData = {
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{
              text: commentText,
              type: "text"
            }]
          }
        ]
      }
    };
    const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueId}/comment`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyData)
    });

    if(response.ok){
      console.log(`Added comment '${commentText}' to issueId: ${issueId}`);
    }
    else{
      console.log(`Failed to add comment '${commentText}' '${await response.text()}' to issueId: ${issueId}`);
    }
  }
  catch(error){
    console.log(error);
  }
};

export async function addComment(payload) {
  const issueId = payload.issueId;
  const comment = payload.comment;

  await addJiraCommentInternal(issueId, comment);
} 

export async function fetchComments(payload) {
  const issueId = payload.issueId;
  const response = await api.asUser().requestJira(route`/rest/api/3/issue/${issueId}/comment`, {
    headers: {
      'Accept': 'application/json'
    }
  });
  return response.json();
}  

export async function getIssues(payload, context) {
  try {
    const projectKey = payload.context?.jira?.jiraContexts?.[0]?.projectKey || 'SPN';
    
    const jql = `project=${projectKey}`;
    const response = await api.asUser().requestJira(route`/rest/api/3/search/jql`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jql: jql,
        maxResults: 100,
        fields: [
          'summary',        // Expense name
          'description',    // Details
          'labels',         // Categories (Food, Rent, etc.)
          'created',        // Date of expense
          'customfield_xxxxx', // Amount (replace with your custom field ID)
          'status'          // Pending/Approved/Paid
        ]
      })
    });
    
    if (!response.ok) {
      console.log(`Failed to fetch issues: ${await response.text()}`);
      return { error: 'Failed to fetch issues' };
    }
    
    const data = await response.json();
    const cleanData = await extractIssueDetails(data);
    
    // Calculate financial insights
    const insights = calculateFinancialInsights(cleanData);
    
    return { 
      expenses: cleanData,
      insights: insights 
    };
  } catch (error) {
    console.log(`Error in getIssues: ${error}`);
    return { error: error.message };
  }
}

export async function extractIssueDetails(data) {
  return data.issues.map(issue => {
    let descriptionText = '';
    if (issue.fields.description?.content) {
      descriptionText = issue.fields.description.content
        .map(node => {
          if (node.content) {
            return node.content
              .map(textNode => textNode.text || '')
              .join(' ');
          }
          return '';
        })
        .join('\n');
    }

    return {
      key: issue.key,
      name: issue.fields.summary,
      description: descriptionText || 'No description',
      category: issue.fields.labels?.[0] || 'Uncategorized',
      allCategories: issue.fields.labels || [],
      amount: issue.fields.customfield_xxxxx || 0, // Replace with actual field ID
      date: issue.fields.created,
      status: issue.fields.status?.name,
    };
  });
}

// NEW: Calculate spending insights
function calculateFinancialInsights(expenses) {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  // Group by category
  const byCategory = expenses.reduce((acc, exp) => {
    const cat = exp.category;
    if (!acc[cat]) acc[cat] = { total: 0, count: 0 };
    acc[cat].total += exp.amount;
    acc[cat].count += 1;
    return acc;
  }, {});
  
  // Find biggest spending category
  const topCategory = Object.entries(byCategory)
    .sort((a, b) => b[1].total - a[1].total)[0];
  
  // Calculate this week vs last week
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const thisWeek = expenses.filter(e => new Date(e.date) >= weekAgo);
  const thisWeekTotal = thisWeek.reduce((sum, exp) => sum + exp.amount, 0);
  
  return {
    totalSpent: total,
    expenseCount: expenses.length,
    averageExpense: total / expenses.length,
    topCategory: topCategory ? {
      name: topCategory[0],
      amount: topCategory[1].total,
      percentage: (topCategory[1].total / total * 100).toFixed(1)
    } : null,
    thisWeekSpending: thisWeekTotal,
    categoryBreakdown: byCategory
  };
}