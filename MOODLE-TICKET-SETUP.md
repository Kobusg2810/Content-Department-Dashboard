# Moodle Ticket Submission — Setup Guide

This guide explains how to set up the Google Apps Script so your team can submit tickets from the dashboard.

## Step 1: Open Apps Script

1. Open your **Moodle Support Google Sheet**
2. Go to **Extensions → Apps Script**
3. Delete any existing code in `Code.gs`

## Step 2: Paste This Code

Copy and paste this entire script into the Apps Script editor:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Auto-generate ticket number
    var lastRow = sheet.getLastRow();
    var nextNum = 1;
    if (lastRow > 1) {
      var lastTicket = sheet.getRange(lastRow, 2).getValue(); // Column B = Ticket No
      var match = String(lastTicket).match(/MT-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1]) + 1;
      }
    }
    var ticketNo = "MT-" + String(nextNum).padStart(3, "0");

    // Today's date in DD/MM/YYYY format
    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");

    // Append row: Date, Ticket No, Detail, Contact, Assigned To, Error Type, Status, Date Started, Date Completed
    sheet.appendRow([
      today,
      ticketNo,
      data.ticketDetail || "",
      data.contactPerson || "",
      data.assignedTo || "Unassigned",
      data.errorType || "",
      "Open",
      "",
      ""
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, ticketNo: ticketNo })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "Moodle Ticket API is running" })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

## Step 3: Deploy as Web App

1. Click **Deploy → New Deployment**
2. Click the ⚙️ gear icon → Select **Web app**
3. Set:
   - **Description**: "Moodle Ticket API"
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
4. Click **Deploy**
5. **Authorize** the script when prompted (click through the "unsafe" warning — it's your own script)
6. **Copy the Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/XXXXX.../exec
   ```

## Step 4: Add URL to Dashboard

1. Open `app.js` in your project
2. Find the line:
   ```javascript
   const MOODLE_APPS_SCRIPT_URL = '';
   ```
3. Paste your Web App URL between the quotes
4. Save and redeploy to Vercel

## Testing

After setup, click the **"+ New Ticket"** button on the Moodle Support tab. Fill in the form and submit — the ticket should appear in your Google Sheet within a few seconds.

## Updating the Script

If you need to update team members or error types, edit `moodle-ticket-form.js` in the project. The Apps Script itself doesn't need changes since it just receives whatever data the form sends.
