# Moodle Support Tickets - Setup Guide

## 📊 Google Sheet Structure

Your Moodle Support Tickets Google Sheet should have these columns **in this exact order**:

| Column | Field Name | Data Type | Example |
|--------|------------|-----------|---------|
| A | Date | Date | 2026-01-15 |
| B | Ticket No | Text | MT-001, MT-002 |
| C | Ticket Detail | Text | Brief description of the issue |
| D | Contact Person | Text | John Smith |
| E | Assigned To | Text | Sarah Johnson |
| F | Error Type | Text | Course Access, Technical Issue,etc. |
| G | Status | Text | Open, In Progress, Resolved |
| H | Date Started | Date | 2026-01-15 (or empty if not started) |
| I | Date Completed | Date | 2026-01-16 (or empty if not completed) |

## 🔗 Connecting Your Sheet

### Step 1: Make Sheet Public

1. Open your Google Sheet:
   ```
   https://docs.google.com/spreadsheets/d/1gr6p5PbCV3BVn179TfZtXli4vcF1wUPJKg0J0-mCKig/
   ```

2. Click **Share** (top-right)

3. Click **"Change to anyone with the link"**

4. Set to **Viewer** permission

5. Click **Done**

### Step 2: Verify the Tab Name

Make sure you're using the correct tab: **"Support Tickets Moodle"**

The system is configured to use GID: `1314947373`

### Step 3: Test the Dashboard

1. Open the dashboard
2. Click the **"Moodle Support"** tab
3. Data should load automatically
4. If using sample data, check browser console (F12) for connection messages

## 📋 Data Field Details

### Status Values (Column G)

Use exactly these values:
- `Open` - New ticket, not yet assigned/started
- `In Progress` - Currently being worked on
- `Resolved` - Issue fixed, ticket completed

### Error Type (Column F)

Common error types (you can use your own):
- Course Access
- Assignment Upload
- Technical Issue
- System Error
- User Account
- Grade Inquiry
- General Inquiry
- Course Content
- Quiz/Assessment Issues
- Video/Media Problems

### Date Format (Columns A, H & I)

Use standard date format:
- `YYYY-MM-DD` (e.g., 2026-01-15)
- Or use Google Sheets date picker
- Leave **Date Started** empty if ticket hasn't been picked up yet
- Leave **Date Completed** empty if ticket is still open/in progress

## 📊 Dashboard Features

### Statistics Cards

The dashboard automatically calculates:
- **Total Tickets** - All tickets in the sheet
- **Resolved** - Tickets with status "Resolved" or "Closed"
- **Active Tickets** - Sum of "Open" + "In Progress"
- **Avg. Resolution Time** - Average days between submitted and resolved dates

### Charts

1. **Status Distribution (Donut Chart)**
   - Shows Resolved vs In Progress vs Open
   - Color-coded: Green (Resolved), Orange (In Progress), Red (Open)

2. **Priority Breakdown (Bar Chart)**
   - Horizontal bars showing ticket count by priority
   - Color-coded: Red (Critical), Orange (High), Blue (Medium), Green (Low)

### Data Table

Features:
- ✓ **Sortable columns** - Click headers to sort
- 🔍 **Search** - Filter by any field (ticket #, submitter, status, etc.)
- 📥 **Export CSV** - Download filtered data
- 🎨 **Color-coded badges** - Priority and status indicators
- 📝 **Description preview** - Truncated with hover tooltip

## 🔄 Auto-Refresh

The dashboard automatically refreshes every **5 minutes** to show latest data from your Google Sheet.

Manual refresh: Click the **Refresh** button in the header.

## 💡 Best Practices

### Ticket Numbering

Use a consistent format:
- `MT-001`, `MT-002`, `MT-003` (Moodle Ticket)
- Or `TICKET-2026-001`
- Or your own format

### Assigning Tickets

- Use consistent names for assignees
- Use "Unassigned" for tickets not yet assigned
- This helps with team workload tracking

### Updating Status

Workflow example:
1. New ticket → Status: `Open`
2. Someone starts working → Status: `In Progress`
3. Issue fixed → Status: `Resolved`, add Date Resolved
4. After confirmation → Status: `Closed`

### Priority Guidelines

- **Critical**: System down, multiple users affected, urgent
- **High**: Single user blocked, important deadline
- **Medium**: Normal issues, can wait 1-2 days
- **Low**: Questions, minor issues, no urgency

## 🎯 Common Use Cases

### Finding All Open Tickets

1. Use the **search box**
2. Type: `open`
3. Shows all open tickets

### Checking Your Workload

1. Search for: `Sarah Johnson` (your name)
2. See all tickets assigned to you

### Exporting Monthly Report

1. Filter by date range (use search or Excel after export)
2. Click **Export CSV**
3. Open in Excel/Google Sheets for further analysis

## 🐛 Troubleshooting

### Data Not Loading

**Check:**
1. Is the sheet publicly accessible?
2. Is the tab name exactly "Support Tickets Moodle"?
3. Are columns in the correct order?
4. Open browser console (F12) - any error messages?

### Charts Not Showing

**Check:**
1. Do you have tickets in the sheet?
2. Are Status and Priority values spelled correctly?
3. Refresh the page (Ctrl+R)

### Dates Not Computing

**Check:**
1. Date format is YYYY-MM-DD
2. Both submitted and resolved dates are filled
3. Dates are logical (resolved after submitted)

## 📧 Sample Data

If you want to test with sample data first, the dashboard includes 8 example tickets covering various scenarios:
- Different priorities
- Different statuses
- Different assignees
- Resolved and unresolved tickets

## 🎨 Customization

### Adding New Categories

Simply add new category names in Column G. The dashboard will automatically include them in statistics.

### Adding More Assignees

Add new names in Column D. They'll appear in the assignee breakdown statistics.

### Changing Priority Names

If you want different priority levels, you'll need to update the code in `moodle-data.js` to recognize your custom values.

---

**Need Help?** Check the main [README.md](file:///c:/Users/USER/.gemini/antigravity/playground/spinning-telescope/README.md) or [walkthrough.md](file:///C:/Users/USER/.gemini/antigravity/brain/8ca70957-f0e4-418c-a474-0ef2fd8780ba/walkthrough.md) for more information.
