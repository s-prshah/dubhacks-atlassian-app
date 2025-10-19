// Global variables
let issues = [];
let projectContext = null;

// Debug logging functions
function debugLog(message, type) {
    type = type || 'info';
    const logDiv = document.getElementById('debugLog');
    const logEntry = document.createElement('div');
    logEntry.className = 'debug-log debug-' + type;
    logEntry.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
    logDiv.appendChild(logEntry);
    logDiv.scrollTop = logDiv.scrollHeight;
    
    // Also log to console
    console.log('[' + type.toUpperCase() + ']', message);
}

debugLog('Page loaded', 'success');

// Check if AP is available
if (typeof AP === 'undefined') {
    debugLog('ERROR: AP (Atlassian Connect) is not defined!', 'error');
    debugLog('This page must be viewed inside a Forge app in Jira', 'error');
} else {
    debugLog('AP object is available ✓', 'success');
}

// Initialize Forge Bridge API
async function initForge() {
    try {
        debugLog('Initializing Forge context...', 'info');
        
        // Get the context from Forge
        projectContext = await AP.context.getContext();
        debugLog('Context received: ' + JSON.stringify(projectContext), 'success');
        
        if (projectContext && projectContext.jira && projectContext.jira.project) {
            debugLog('Project Key: ' + projectContext.jira.project.key, 'info');
            debugLog('Project ID: ' + projectContext.jira.project.id, 'info');
        } else {
            debugLog('Warning: No project context found', 'error');
        }
        
    } catch (error) {
        debugLog('Error initializing Forge: ' + error.message, 'error');
        console.error('Forge init error:', error);
    }
}

// Extract text from Atlassian Document Format
function extractText(description) {
    if (!description || !description.content) return '';
    return description.content
        .map(function(node) {
            if (node.content) {
                return node.content.map(function(t) { return t.text || ''; }).join(' ');
            }
            return '';
        })
        .join('\n');
}

// Render the dashboard
function renderDashboard(processedIssues, totalBudget, totalSpent, remaining, percentSpent) {
    let alertHTML = '';
    if (percentSpent > 90) {
        alertHTML = '<div class="alert alert-danger">⚠️ <strong>Warning!</strong> You\'ve used over 90% of your budget. Time to cut back! 🚨</div>';
    } else if (percentSpent > 75) {
        alertHTML = '<div class="alert alert-warning">🟡 Getting close to your budget limit. Watch your spending! 👀</div>';
    } else if (percentSpent > 0) {
        alertHTML = '<div class="alert alert-success">✅ <strong>Nice work!</strong> You\'re staying on track! Keep it up! 🎉</div>';
    }
    
    const tableRows = processedIssues.map(function(issue) {
        const statusClass = issue.remaining < 0 ? 'status-bad' : issue.remaining < issue.budget * 0.2 ? 'status-warning' : 'status-good';
        const statusEmoji = issue.remaining < 0 ? '🔴' : issue.remaining < issue.budget * 0.2 ? '🟡' : '🟢';
        
        return '<tr>' +
            '<td><strong>' + issue.summary + '</strong><br><small style="color: #666;">' + issue.category + '</small></td>' +
            '<td>$' + issue.budget + '</td>' +
            '<td>$' + issue.spent + '</td>' +
            '<td class="' + statusClass + '">$' + issue.remaining + '</td>' +
            '<td>' + statusEmoji + ' ' + issue.status + '</td>' +
            '</tr>';
    }).join('');
    
    document.getElementById('content').innerHTML = alertHTML +
        '<div class="summary-card">' +
        '<h2 style="margin-bottom: 10px;">📊 Budget Summary</h2>' +
        '<div class="summary-grid">' +
        '<div class="stat"><div class="stat-value">$' + totalBudget + '</div><div class="stat-label">Total Budget</div></div>' +
        '<div class="stat"><div class="stat-value">$' + totalSpent + '</div><div class="stat-label">Total Spent</div></div>' +
        '<div class="stat"><div class="stat-value">$' + remaining + '</div><div class="stat-label">Remaining</div></div>' +
        '<div class="stat"><div class="stat-value">' + percentSpent + '%</div><div class="stat-label">Budget Used</div></div>' +
        '</div></div>' +
        '<div class="section"><h2 class="section-title">📝 Your Expense Tracker</h2>' +
        (processedIssues.length === 0 ? '<p>No expenses tracked yet! Use the form on the right to add your first expense.</p>' :
        '<table class="expense-table"><thead><tr><th>Category</th><th>Budget</th><th>Spent</th><th>Remaining</th><th>Status</th></tr></thead><tbody>' +
        tableRows + '</tbody></table>') +
        '</div>';
}

// Load dashboard data
async function loadDashboard() {
    try {
        debugLog('Loading dashboard data...', 'info');
        
        const projectKey = (projectContext && projectContext.jira && projectContext.jira.project) ? 
            projectContext.jira.project.key : 'SPN';
        debugLog('Using project key: ' + projectKey, 'info');
        
        debugLog('Making API request to /rest/api/3/search...', 'info');
        
        const response = await AP.request({
            url: '/rest/api/3/search',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                jql: 'project=' + projectKey + ' ORDER BY created DESC',
                maxResults: 50,
                fields: ['summary', 'description', 'status', 'labels']
            })
        });
        
        debugLog('API Response Status: ' + response.statusCode, response.statusCode === 200 ? 'success' : 'error');
        
        const data = JSON.parse(response.body);
        issues = data.issues || [];
        debugLog('Found ' + issues.length + ' issues', 'success');
        
        // Calculate budget totals
        let totalBudget = 0;
        let totalSpent = 0;
        
        const processedIssues = issues.map(function(issue) {
            const description = extractText(issue.fields.description);
            const budgetMatch = description.match(/[Bb]udget:?\s*\$?(\d+)/);
            const spentMatch = description.match(/[Ss]pent:?\s*\$?(\d+)/) || 
                              description.match(/[Cc]urrent\s+spend:?\s*\$?(\d+)/) ||
                              description.match(/[Tt]otal:?\s*\$?(\d+)/);
            
            const budget = budgetMatch ? parseInt(budgetMatch[1]) : 0;
            const spent = spentMatch ? parseInt(spentMatch[1]) : 0;
            
            totalBudget += budget;
            totalSpent += spent;
            
            return {
                key: issue.key,
                summary: issue.fields.summary,
                budget: budget,
                spent: spent,
                remaining: budget - spent,
                status: (issue.fields.status && issue.fields.status.name) || 'To Do',
                category: (issue.fields.labels && issue.fields.labels[0]) || 'uncategorized'
            };
        });
        
        const remaining = totalBudget - totalSpent;
        const percentSpent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
        
        renderDashboard(processedIssues, totalBudget, totalSpent, remaining, percentSpent);
        
    } catch (error) {
        debugLog('Error loading dashboard: ' + error.message, 'error');
        console.error('Dashboard error:', error);
        
        document.getElementById('content').innerHTML =
            '<div style="color: red; padding: 20px; border: 2px solid red; border-radius: 10px;">' +
            '<h3>❌ Error Loading Data</h3>' +
            '<p>' + error.message + '</p>' +
            '<p>Check the debug panel in the bottom right!</p>' +
            '</div>';
    }
}

// Add expense form handler
document.getElementById('expenseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    debugLog('Form submitted!', 'info');
    
    const category = document.getElementById('category').value;
    const budget = document.getElementById('budget').value;
    const spent = document.getElementById('spent').value;
    const notes = document.getElementById('notes').value;
    
    debugLog('Category: ' + category + ', Budget: $' + budget + ', Spent: $' + spent, 'info');
    
    const btn = document.getElementById('addBtn');
    btn.disabled = true;
    btn.textContent = 'Adding...';
    
    try {
        const projectKey = (projectContext && projectContext.jira && projectContext.jira.project) ? 
            projectContext.jira.project.key : 'SPN';
        debugLog('Creating issue in project: ' + projectKey, 'info');
        
        const issueData = {
            fields: {
                project: { key: projectKey },
                summary: 'Track ' + category,
                description: {
                    type: 'doc',
                    version: 1,
                    content: [{
                        type: 'paragraph',
                        content: [{
                            type: 'text',
                            text: 'Budget: $' + budget + '\nCurrent spend: $' + spent + '\n' + (notes ? 'Notes: ' + notes : '')
                        }]
                    }]
                },
                issuetype: { name: 'Task' },
                labels: [category.toLowerCase().replace(/\s+/g, '-')]
            }
        };
        
        debugLog('Sending create issue request...', 'info');
        
        const result = await AP.request({
            url: '/rest/api/3/issue',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(issueData)
        });
        
        debugLog('Create issue response: ' + result.statusCode, result.statusCode === 201 ? 'success' : 'error');
        debugLog('Response body: ' + result.body.substring(0, 200), 'info');
        
        if (result.statusCode === 201) {
            const responseData = JSON.parse(result.body);
            debugLog('✅ Issue created: ' + responseData.key, 'success');
            alert('✅ Expense added successfully! Issue: ' + responseData.key);
            
            // Clear form
            document.getElementById('category').value = '';
            document.getElementById('budget').value = '';
            document.getElementById('spent').value = '';
            document.getElementById('notes').value = '';
            
            // Reload dashboard
            await loadDashboard();
        } else {
            throw new Error('HTTP ' + result.statusCode + ': ' + result.body);
        }
        
    } catch (error) {
        debugLog('❌ Error adding expense: ' + error.message, 'error');
        console.error('Add expense error:', error);
        alert('❌ Error adding expense: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Add Expense';
    }
});

// AI Chat functionality
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

function addMessage(text, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-' + (isUser ? 'user' : 'ai');
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendToAI(prompt) {
    addMessage(prompt, true);
    addMessage('Thinking...', false);
    
    // Simulate AI response (in real implementation, this would call your Rovo agent)
    setTimeout(function() {
        chatMessages.removeChild(chatMessages.lastChild);
        
        // Generate context-aware response based on current budget data
        const totalBudget = issues.reduce(function(sum, i) {
            const desc = extractText(i.fields.description);
            const match = desc.match(/[Bb]udget:?\s*\$?(\d+)/);
            return sum + (match ? parseInt(match[1]) : 0);
        }, 0);
        
        let response = "I'd be happy to help! ";
        
        if (prompt.toLowerCase().includes('doing')) {
            response += "You're tracking $" + totalBudget + " in budgets across " + issues.length + " categories. Keep it up! 💪";
        } else if (prompt.toLowerCase().includes('cut') || prompt.toLowerCase().includes('spend')) {
            response += "Try meal prepping on Sundays to save on food costs, and make coffee at home instead of buying it out. You could save $100+ per month! ☕";
        } else if (prompt.toLowerCase().includes('meal')) {
            response += "Here are some budget-friendly ideas: 1) Pasta with veggies ($2/meal) 2) Rice bowls with eggs ($1.50/meal) 3) Peanut butter sandwiches ($0.75/meal). Meal prep on Sundays! 🍝";
        } else {
            response += "For personalized advice, try asking about your spending habits, budget tips, or meal ideas. I'm here to help you save money! 💰";
        }
        
        addMessage(response, false);
    }, 1000);
}

sendBtn.addEventListener('click', function() {
    const message = chatInput.value.trim();
    if (message) {
        sendToAI(message);
        chatInput.value = '';
    }
});

chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});

// Quick prompts
document.querySelectorAll('.quick-prompt').forEach(function(btn) {
    btn.addEventListener('click', function() {
        const prompt = btn.dataset.prompt;
        sendToAI(prompt);
    });
});

// Initialize and load dashboard on page load
(async function init() {
    debugLog('Starting initialization...', 'info');
    
    try {
        await initForge();
        await loadDashboard();
        debugLog('Initialization complete!', 'success');
    } catch (error) {
        debugLog('Initialization failed: ' + error.message, 'error');
    }
})();