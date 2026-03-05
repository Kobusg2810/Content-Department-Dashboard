function doPost(e) {
    try {
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        var data = JSON.parse(e.postData.contents);

        var lastRow = sheet.getLastRow();
        var nextNum = 1;
        if (lastRow > 1) {
            var lastTicket = sheet.getRange(lastRow, 2).getValue();
            var nums = String(lastTicket).match(/(\d+)/);
            if (nums) {
                nextNum = parseInt(nums[1]) + 1;
            }
        }
        var ticketNo = String(nextNum);

        var today;
        if (data.ticketDate) {
            var d = new Date(data.ticketDate);
            today = Utilities.formatDate(d, Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
        } else {
            today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
        }

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

        return ContentService.createTextOutput(JSON.stringify({ success: true, ticketNo: ticketNo })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
    }
}

function doGet(e) {
    return ContentService.createTextOutput(JSON.stringify({ status: "Moodle Ticket API is running" })).setMimeType(ContentService.MimeType.JSON);
}
