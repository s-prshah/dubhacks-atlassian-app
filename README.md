# dubhacks-atlassian-app

# 💰 Spendify — A Finance Dashboard for Students (Built with Atlassian Forge)

Spendify is a **budget and expense-tracking dashboard** built directly inside **Jira** using Atlassian Forge.  
Our goal was to help college students and project teams better manage their finances while learning how to extend Jira’s functionality.

---

## 🚀 What It Does
Spendify integrates seamlessly with Jira dashboards and issue panels to give users a quick overview of their spending habits and monthly goals.

**Features:**
- 📊 **Interactive Dashboard Gadget** — Displays budget goals and expense summaries inside Jira’s Default Dashboard.
- 🧮 **Budget Configuration** — Users can easily set a monthly spending goal via a configuration form.
- 💡 **Jira Integration** — Built as a Forge dashboard gadget (`jira:dashboardGadget`) and issue panel (`jira:issuePanel`).
- ☁️ **Persistent Data Storage** — Uses Forge storage APIs to save and retrieve expense data.
- ⚙️ **Customizable UI** — Developed with React + Vite, styled for clarity and speed.

---

## 🧠 What We Learned
This was every member of our team’s **first hackathon** and our **first time using Atlassian Forge**.  
During the project, we learned:
- How **Jira** manages dashboards, issues, and gadgets
- How to build and deploy **Forge apps** and manage environments
- How **Rovo Agents** and Forge resolvers interact with front-end code
- How to debug real-time issues using `forge tunnel`

---

## 🏆 Accomplishments We’re Proud Of
- Successfully deployed our **first working Jira dashboard gadget**
- Built an interactive **Spendify configuration UI** from scratch
- Solved Forge deployment issues, manifest validation, and environment setup
- Worked effectively as a **first-time hackathon team**
- Integrated Forge, React, and Atlassian APIs into one unified app

---

## 🛠️ Tech Stack
| Area | Technology |
|------|-------------|
| Platform | Atlassian Forge |
| Frontend | React + Vite |
| Backend | Node.js (Forge Functions) |
| Design | Jira Dashboard Gadget UI |
| Deployment | Forge CLI |
| Version Control | Git + GitHub |

---

## ⚙️ Project Structure
Spendify/
├── manifest.yml # Forge app manifest
├── src/ # React source files
│ ├── Dashboard.jsx # Main dashboard component
│ └── index.jsx # App entry point
├── static/
│ └── finjira/
│ ├── build/ # Compiled UI files (Vite build output)
│ └── config/config.html # Dashboard configuration UI
├── package.json # Build scripts & dependencies
└── README.md # You are here!

yaml
Copy code

---

## 🔧 How to Run It Locally
### 1️⃣ Set up your Forge environment
```bash
forge login
forge register
2️⃣ Build the UI
bash
Copy code
npm install
npm run build
3️⃣ Deploy and install the app
bash
Copy code
forge deploy --environment dev
forge install --upgrade --environment dev --product jira --site https://your-site.atlassian.net
4️⃣ Test with live logs
bash
Copy code
forge tunnel
Then open your Jira Dashboard → Add Gadget → Spendify Finance Dashboard
Click Edit to set your budget goal, and your dashboard will appear 🎉

📁 Manifest Overview
yaml
Copy code
modules:
  jira:dashboardGadget:
    - key: spendify-dashboard
      title: Spendify Finance Dashboard
      description: A finance tracker gadget for college students.
      resource: finance-ui
      entryPoint: index.html
      resolver:
        function: resolver
      edit:
        resource: finance-config
        entryPoint: config/config.html

  jira:issuePanel:
    - key: spendify-panel
      title: Spendify Expense Tracker
      description: Track personal or project expenses directly in a Jira issue.
      resource: finance-ui
      resolver:
        function: resolver

  function:
    - key: resolver
      handler: index.handler

resources:
  - key: finance-ui
    path: static/finjira/build
  - key: finance-config
    path: static/finjira

permissions:
  scopes:
    - storage:app
  content:
    styles:
      - unsafe-inline
💬 Future Improvements
Add transaction tracking and visualizations (pie charts, graphs)

Connect with Jira issue budgets for project expense tracking

Integrate Rovo Agent prompts for automatic insights

Implement real-time sync with Forge Storage API

👩‍💻 Team Spendify
Prisha Shah, Ananya Prakash, Roxy Stanescu, Arisha Gupta

Built for DubHacks 2025 🏆
