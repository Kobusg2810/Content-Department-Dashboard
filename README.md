# SpecCon Department Dashboard

A modern, visual dashboard for tracking QCTO Qualification loading processes and Moodle support tickets with real-time Google Sheets integration.

## 🎨 Features

### QCTO Qualification Tracking
- **Visual Statistics**: Overview cards showing total, completed, in-progress, and not-started qualifications
- **Interactive Charts**: 
  - Completion donut chart (Completed vs Outstanding)
  - Stage-by-stage progress bar chart
- **Detailed Data Table**: 
  - All qualification details with sortable columns
  - Visual progress indicators for each qualification
  - Search/filter functionality
- **Export Capability**: Download data as CSV for reporting

### Moodle Support Tickets
- **Ticket Statistics**: Total tickets, resolved count, active tickets, average resolution time
- **Visual Analytics**:
  - Status distribution donut chart (Resolved vs In Progress vs Open)
  - Priority breakdown bar chart (Critical, High, Medium, Low)
- **Support Ticket Table**:
  - Complete ticket details with sortable columns
  - Color-coded priority and status badges
  - Search across all ticket fields
  - Export to CSV for reporting
- **Real-time Updates**: Auto-refresh from Google Sheets

### Design
- ✨ **SpecCon Branding**: Custom color palette with purple/blue and cyan accents
- 🌙 **Premium Dark Theme**: Modern glassmorphism effects
- 📱 **Responsive**: Works on desktop, tablet, and mobile
- 🎭 **Smooth Animations**: Micro-interactions and transitions

## 🚀 Quick Start

### Option 1: Simple HTTP Server (Recommended)

1. Open PowerShell in this directory
2. Run one of these commands:

```powershell
# Using Python (if installed)
python -m http.server 8000

# OR using Node.js (if installed)
npx -y http-server -p 8000

# OR using PHP (if installed)
php -S localhost:8000
```
**Tip:** If port 8000 is busy, try `8080`, `8081`, or `8082`.

3. Open your browser to: `http://localhost:8000`

### Option 2: Direct File Access

Simply open `index.html` in your browser. Note: Some features may require a server.

## 📊 Google Sheets Integration

### Current Status
The dashboard uses **sample data** for both sections until you make your Google Sheets publicly accessible.

### QCTO Qualifications Sheet

**Steps to Enable Real Data:**

1. **Make your Google Sheet publicly accessible:**
   - Open your Google Sheet: https://docs.google.com/spreadsheets/d/14pEQHY3stCEzrDry8bnIosh1SLNAarYHZFuH1-XlNX4/
   - Click **Share** (top right)
   - Click **Change to anyone with the link**
   - Set permission to **Viewer**
   - Click **Done**

2. **Verify your sheet structure matches:**
   
   Your Google Sheet should have these columns in this order:
   - Column A: Qualification Name
   - Column B: Qualification ID
   - Column C: Modules
   - Column D: IAC Aligned (TRUE/FALSE or checkboxes)
   - Column E: AAC Aligned (TRUE/FALSE)
   - Column F: Loaded on Moodle (TRUE/FALSE)
   - Column G: Learner Guide & Assessments Checked (TRUE/FALSE)
   - Column H: Course Activities Created (TRUE/FALSE)
   - Column I: Content Reviewed (TRUE/FALSE)
   - Column J: Alignment Matrix Corrected (TRUE/FALSE)

### Moodle Support Tickets Sheet

**Steps to Enable Real Data:**

1. **Make your Google Sheet publicly accessible:**
   - Open your Google Sheet: https://docs.google.com/spreadsheets/d/1gr6p5PbCV3BVn179TfZtXli4vcF1wUPJKg0J0-mCKig/
   - Use the tab: **"Support Tickets Moodle"**
   - Click **Share** → **Change to anyone with the link** → **Viewer**
   - Click **Done**

2. **Verify your sheet structure matches:**
   
   Your Google Sheet should have these columns in this order:
   - Column A: Ticket Number
   - Column B: Date Submitted (YYYY-MM-DD format)
   - Column C: Submitter
   - Column D: Assignee
   - Column E: Priority (Critical, High, Medium, Low)
   - Column F: Status (Open, In Progress, Resolved, Closed)
   - Column G: Category
   - Column H: Description
   - Column I: Date Resolved (YYYY-MM-DD format or empty)

**For detailed Moodle setup instructions**, see [MOODLE-SETUP.md](file:///c:/Users/USER/.gemini/antigravity/playground/spinning-telescope/MOODLE-SETUP.md)

### Auto-Refresh
- Dashboard automatically refreshes every **5 minutes**
- Click the **Refresh** button for manual updates

## 🎯 Usage

### Navigation
- Use the **tab buttons** to switch between QCTO and Moodle sections
- Currently, only QCTO section is active (Moodle coming soon)

### Search & Filter
- Use the **search box** to filter qualifications by name, ID, or modules
- Click **column headers** in the table to sort

### Export Data
- Click **Export CSV** to download current data
- Exported file includes all visible (filtered) qualifications

## 📁 Project Structure

```
spinning-telescope/
├── index.html          # Main HTML structure
├── styles.css          # SpecCon design system & styling
├── app.js              # Application initialization & orchestration
├── data.js             # Data fetching & Google Sheets integration
├── components.js       # UI components (stats, table)
├── charts.js           # Chart.js visualizations
└── README.md           # This file
```

## 🛠️ Customization

### Update Sample Data
Edit `data.js` and modify the `sampleQCTOData` array to match your qualifications.

### Change Colors
Edit the CSS variables in `styles.css` under the `:root` section:
```css
:root {
    --primary-600: #6366f1;  /* Main purple */
    --accent-500: #06b6d4;   /* Cyan accent */
    /* etc. */
}
```

### Modify Auto-Refresh Interval
In `app.js`, change the interval (currently 5 minutes):
```javascript
setInterval(async () => {
    await loadData();
}, 5 * 60 * 1000);  // Change this value (in milliseconds)
```

## 🔮 Coming Soon

### Moodle Support Tickets Section
- Ticket tracking with status indicators
- Priority levels and assignee management
- Response time analytics
- Similar visual charts and tables

## 📝 Data Format

### Boolean Values
The system recognizes these as TRUE:
- `TRUE`, `true`
- `YES`, `yes`
- `1`
- `X`, `x`
- `✓`

All other values are considered FALSE.

### Completion Calculation
Progress is calculated as:
```
(Completed Stages / Total Stages) × 100
```

Where stages are:
1. IAC Aligned
2. AAC Aligned
3. Loaded on Moodle
4. Learner Guide Checked
5. Course Activities Created
6. Content Reviewed
7. Alignment Matrix Corrected

## 🐛 Troubleshooting

### Charts not displaying?
Make sure you have internet connection (Chart.js loads from CDN).

### Data not updating from Google Sheets?
1. Verify the sheet is publicly accessible
2. Check browser console (F12) for errors
3. Ensure sheet structure matches the expected format

### Styling looks broken?
1. Check that `styles.css` is in the same directory
2. Clear browser cache (Ctrl+Shift+R)
3. Ensure Google Fonts can load (internet required)

## 📧 Support

For issues or questions, contact your SpecCon development team.

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Developed for**: SpecCon Content Department
