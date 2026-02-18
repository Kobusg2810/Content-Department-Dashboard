# Quick Start Guide - QCTO Dashboard

## 🚀 Fastest Way to Open

### Option 1: Double-Click (Easiest)

1. Open File Explorer
2. Navigate to: `c:\Users\USER\.gemini\antigravity\playground\spinning-telescope`
3. **Double-click** `index.html`
4. Dashboard opens in your browser! ✨

---

### Option 2: Local Server (For Google Sheets Integration)

1. **Open PowerShell** in the dashboard folder:
   - Right-click in File Explorer
   - Select "Open in Terminal" or "Open PowerShell here"

2. **Run one of these commands:**

   ```powershell
   # If you have Python installed:
   python -m http.server 8000
   
   # OR if you have Node.js:
   npx -y http-server -p 8000
   ```

3. **Open your browser to:**
   ```
   http://localhost:8000
   ```

---

## ⚙️ Connecting Your Google Sheet

Your dashboard will use sample data until you make your Google Sheet publicly accessible.

### Steps:

1. Open your Google Sheet:
   https://docs.google.com/spreadsheets/d/14pEQHY3stCEzrDry8bnIosh1SLNAarYHZFuH1-XlNX4/

2. Click **"Share"** (top-right corner)

3. Click **"Change to anyone with the link"**

4. Make sure it's set to **"Viewer"**

5. Click **"Done"**

6. **Refresh the dashboard** - it will now load your real data!

---

## 📊 Expected Sheet Structure

Make sure your Google Sheet has these columns **in this exact order**:

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Qualification Name | Qualification ID | Modules | IAC Aligned | AAC Aligned | Loaded on Moodle | Learner Guide Checked | Activities Created | Content Reviewed | Matrix Corrected |

**For checkboxes/boolean columns (D-J):**
- Use: `TRUE`, `YES`, `1`, `X`, or `✓` for completed
- Use: `FALSE`, `NO`, `0`, or leave empty for not completed

---

## 🎯 Testing the Dashboard

Once opened, try these features:

### 1. View Statistics
- See total qualifications at a glance
- Check completion percentages

### 2. Explore Charts
- **Donut Chart**: Shows Completed vs In Progress vs Not Started
- **Bar Chart**: Shows progress for each stage

### 3. Use the Data Table
- **Search**: Type in the search box to filter
- **Sort**: Click column headers to sort
- **Export**: Click "Export CSV" to download

### 4. Refresh Data
- Click the **"Refresh"** button in the header
- Or wait 5 minutes for auto-refresh

---

## 👥 For You and Jesaia

Both of you can access the dashboard:
- No login required
- View-only by default
- Update data in Google Sheets, dashboard reflects changes

---

## ❓ Need Help?

Check the full documentation:
- [README.md](file:///c:/Users/USER/.gemini/antigravity/playground/spinning-telescope/README.md) - Complete guide
- [walkthrough.md](file:///C:/Users/USER/.gemini/antigravity/brain/8ca70957-f0e4-418c-a474-0ef2fd8780ba/walkthrough.md) - Detailed walkthrough

---

## 🎨 What You'll See

The dashboard features:
- ✨ **SpecCon purple/cyan branding**
- 🌙 **Premium dark theme**
- 📊 **Interactive charts**
- 📋 **Sortable, searchable table**
- 📱 **Responsive design**

**Enjoy your new dashboard!** 🎉
