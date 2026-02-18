// Improved CSV parser that handles multi-line quoted fields
function parseCSVToMoodleTickets(csvData) {
    const data = [];
    const rows = [];

    // Parse CSV properly handling quoted multi-line fields
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < csvData.length; i++) {
        const char = csvData[i];
        const nextChar = csvData[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                // Escaped quote
                currentField += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            // End of field
            currentRow.push(currentField.trim());
            currentField = '';
        } else if (char === '\n' && !insideQuotes) {
            // End of row
            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField.trim());
                if (currentRow.some(f => f.length > 0)) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentField = '';
            }
        } else if (char === '\r') {
            // Skip carriage returns
            continue;
        } else {
            currentField += char;
        }
    }

    // Add last row if exists
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f.length > 0)) {
            rows.push(currentRow);
        }
    }

    console.log(`📄 CSV parsed into ${rows.length} rows (including header)`);

    // Skip header row and process data
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];

        // Skip if not enough columns or no ticket number
        if (values.length < 7 || !values[1]?.trim()) {
            continue;
        }

        // Parse status with smart detection
        let status = values[6]?.trim() || '';

        // Normalize status values
        const statusLower = status.toLowerCase();
        if (statusLower.includes('complete') || statusLower.includes('resolved') || statusLower.includes('closed')) {
            status = 'Completed';
        } else if (statusLower.includes('progress') || statusLower.includes('working') || statusLower.includes('pending')) {
            status = 'In Progress';
        } else if (statusLower.includes('open') || statusLower.includes('new')) {
            status = 'Open';
        } else if (status === '') {
            // Infer status from dates if empty
            const dateStarted = values[7]?.trim() || '';
            const dateCompleted = values[8]?.trim() || '';

            if (dateCompleted) {
                status = 'Completed';
            } else if (dateStarted) {
                status = 'In Progress';
            } else {
                status = 'Open';
            }
        }

        const obj = {
            date: values[0]?.trim() || '',
            ticketNo: values[1]?.trim() || '',
            ticketDetail: values[2]?.trim() || '',
            contactPerson: values[3]?.trim() || '',
            assignedTo: values[4]?.trim() || 'Unassigned',
            errorType: values[5]?.trim() || '',
            status: status,
            dateStarted: values[7]?.trim() || '',
            dateCompleted: values[8]?.trim() || ''
        };

        data.push(obj);
    }

    console.log(`✅ Parsed ${data.length} Moodle tickets`);
    if (data.length > 0) {
        console.log('First ticket:', data[0].ticketNo, '-', data[0].ticketDetail.substring(0, 50));
        console.log('Last ticket:', data[data.length - 1].ticketNo, '-', data[data.length - 1].ticketDetail.substring(0, 50));
    }

    return data;
}

// Export for use
export { parseCSVToMoodleTickets };
