// Sample Moodle support ticket data
// In production, this will be fetched from your Google Sheet
export const sampleMoodleTickets = [
    {
        date: "2026-01-15",
        ticketNo: "MT-001",
        ticketDetail: "Student cannot access course materials",
        contactPerson: "John Smith",
        assignedTo: "Sarah Johnson",
        errorType: "Course Access",
        status: "Resolved",
        dateStarted: "2026-01-15",
        dateCompleted: "2026-01-16"
    },
    {
        date: "2026-01-20",
        ticketNo: "MT-002",
        ticketDetail: "Error uploading assignment files",
        contactPerson: "Mary Jones",
        assignedTo: "Michael Brown",
        errorType: "Assignment Upload",
        status: "In Progress",
        dateStarted: "2026-01-20",
        dateCompleted: ""
    },
    {
        date: "2026-01-22",
        ticketNo: "MT-003",
        ticketDetail: "How to download certificate",
        contactPerson: "David Lee",
        assignedTo: "Sarah Johnson",
        errorType: "General Inquiry",
        status: "Open",
        dateStarted: "",
        dateCompleted: ""
    },
    {
        date: "2026-01-25",
        ticketNo: "MT-004",
        ticketDetail: "Quiz not submitting properly",
        contactPerson: "Emma Wilson",
        assignedTo: "Michael Brown",
        errorType: "Technical Issue",
        status: "Resolved",
        dateStarted: "2026-01-25",
        dateCompleted: "2026-01-26"
    },
    {
        date: "2026-02-01",
        ticketNo: "MT-005",
        ticketDetail: "Video not playing in lesson 3",
        contactPerson: "Robert Taylor",
        assignedTo: "Sarah Johnson",
        errorType: "Course Content",
        status: "Open",
        dateStarted: "",
        dateCompleted: ""
    },
    {
        date: "2026-02-03",
        ticketNo: "MT-006",
        ticketDetail: "Database connection timeout error",
        contactPerson: "Lisa Anderson",
        assignedTo: "Michael Brown",
        errorType: "System Error",
        status: "In Progress",
        dateStarted: "2026-02-03",
        dateCompleted: ""
    },
    {
        date: "2026-02-04",
        ticketNo: "MT-007",
        ticketDetail: "Password reset request",
        contactPerson: "James Martin",
        assignedTo: "Sarah Johnson",
        errorType: "User Account",
        status: "Resolved",
        dateStarted: "2026-02-04",
        dateCompleted: "2026-02-04"
    },
    {
        date: "2026-02-05",
        ticketNo: "MT-008",
        ticketDetail: "Grade not showing for final exam",
        contactPerson: "Patricia Garcia",
        assignedTo: "Unassigned",
        errorType: "Grade Inquiry",
        status: "Open",
        dateStarted: "",
        dateCompleted: ""
    }
];

/**
 * Robust date parser for various formats (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, ISO strings)
 * Always constructs dates in local time to avoid timezone offset issues.
 * @param {string} dateStr - Date string to parse
 * @returns {Date} parsed Date object (Invalid Date if parsing fails)
 */
export function parseCustomDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return new Date('Invalid');

    let str = dateStr.trim();

    // Strip time portion if present (e.g. "2026-04-05T10:00:00" or "2026-04-05 10:00")
    if (str.includes('T')) str = str.split('T')[0];
    else if (str.includes(' ')) str = str.split(' ')[0];

    // 1. DD/MM/YYYY or DD-MM-YYYY  (day first — South African convention)
    const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
        const day   = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed
        const year  = parseInt(dmyMatch[3], 10);
        const d = new Date(year, month, day);
        if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
            return d;
        }
    }

    // 2. YYYY-MM-DD (ISO date only — parse as local to avoid UTC midnight offset)
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const year  = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10) - 1;
        const day   = parseInt(isoMatch[3], 10);
        const d = new Date(year, month, day);
        if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
            return d;
        }
    }

    // 3. Fallback to browser parser (handles "07 Apr 2026", etc.)
    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? new Date('Invalid') : fallback;
}

/**
 * Fetch Moodle ticket data from Google Sheets
 * @param {string} sheetUrl - The Google Sheet URL
 * @param {string} gid - The sheet tab ID (gid parameter)
 * @returns {Promise<Array>} Array of ticket objects
 */
export async function fetchMoodleTickets(sheetUrl = null, gid = null) {
    if (!sheetUrl) {
        console.log('Using sample Moodle ticket data. To connect to Google Sheets, provide the sheet URL.');
        return Promise.resolve(sampleMoodleTickets);
    }

    try {
        // Extract sheet ID from URL
        const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (!sheetIdMatch) {
            throw new Error('Invalid Google Sheets URL');
        }

        const sheetId = sheetIdMatch[1];

        // For public sheets, use the CSV export endpoint
        // Only add gid parameter if it's provided (for multi-tab sheets)
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const csvUrl = gid
            ? `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}&t=${timestamp}`
            : `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&t=${timestamp}`;

        const response = await fetch(csvUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch data from Google Sheets. Make sure the sheet is publicly accessible.');
        }

        const csvData = await response.text();
        console.log(`📥 Fetched CSV from: ${csvUrl}`);
        console.log(`📄 CSV length: ${csvData.length} characters, ~${csvData.split('\n').length} lines`);
        const parsedData = parseCSVToMoodleTickets(csvData);

        return parsedData;
    } catch (error) {
        console.error('Error fetching Moodle tickets from Google Sheets:', error);
        console.log('Falling back to sample data');
        return sampleMoodleTickets;
    }
}

/**
 * Parse CSV data to Moodle ticket objects
 * Columns: Date, Ticket No, Ticket Detail, Contact Person, Assigned To, Error Type, Status, Date Started, Date Completed
 * @param {string} csvData - Raw CSV string
 * @returns {Array} Array of ticket objects
 */
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
        } else if (statusLower.includes('progress')) {
            status = 'In Progress';
        } else if (statusLower.includes('open') || statusLower.includes('new') || statusLower.includes('pending') || statusLower.includes('hold')) {
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

        let errorType = values[5]?.trim() || '';
        if (errorType === 'Loading') {
            errorType = 'Loading Course';
        }

        const obj = {
            date: values[0]?.trim() || '',
            ticketNo: values[1]?.trim() || '',
            ticketDetail: values[2]?.trim() || '',
            contactPerson: values[3]?.trim() || '',
            assignedTo: values[4]?.trim() || 'Unassigned',
            errorType: errorType,
            status: status,
            dateStarted: values[7]?.trim() || '',
            dateCompleted: values[8]?.trim() || ''
        };

        data.push(obj);
    }

    console.log(`✅ Parsed ${data.length} Moodle tickets`);
    if (data.length > 0) {
        console.log('First ticket:', data[0].ticketNo);
        console.log('Last ticket:', data[data.length - 1].ticketNo);
    }

    return data;
}

/**
 * Parse a CSV line handling quoted values
 * @param {string} line - CSV line
 * @returns {Array} Array of values
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

/**
 * Calculate statistics for Moodle tickets
 * @param {Array} tickets - Array of ticket objects
 * @returns {Object} Statistics object
 */
export function calculateMoodleStats(tickets) {
    const total = tickets.length;

    // Status breakdown - flexible matching
    console.log('Moodle Tickets Status Debug:', tickets.map(t => ({ ticket: t.ticketNo, status: t.status })));

    const resolved = tickets.filter(t => {
        const s = t.status.toLowerCase();
        return s === 'completed' || s === 'resolved' || s.includes('complete') || s.includes('closed');
    }).length;

    // Active is simply Total - Resolved (ensures no missing tickets)
    const active = total - resolved;
    const closed = resolved;

    // Break down Active into meaningful sub-categories
    const escalated = tickets.filter(t => {
        const s = t.status.toLowerCase();
        return s === 'escalated' || s.includes('escalated');
    }).length;

    const inProgress = tickets.filter(t => {
        const s = t.status.toLowerCase();
        return (s === 'in progress' || s.includes('progress')) && !s.includes('complete') && !s.includes('resolved') && !s.includes('escalated');
    }).length;

    // Open is the remainder of Active tickets (catches everything else: 'Open', 'New', 'On Hold', 'Unassigned', etc.)
    const open = active - inProgress;

    console.log('Moodle Stats:', { total, active, open, inProgress, resolved });

    // Error Type breakdown
    const errorTypes = {};
    tickets.forEach(ticket => {
        const type = ticket.errorType || 'Uncategorized';
        errorTypes[type] = (errorTypes[type] || 0) + 1;
    });

    // Assignee breakdown
    const assignees = {};
    tickets.forEach(ticket => {
        const assignee = ticket.assignedTo || 'Unassigned';
        assignees[assignee] = (assignees[assignee] || 0) + 1;
    });

    // Calculate average resolution time (for completed tickets)
    // Filter for tickets with valid dates
    const completedTickets = tickets.filter(t => t.dateCompleted && t.date);
    let avgResolutionDays = 0;
    let avgResolutionDaysThisMonth = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    if (completedTickets.length > 0) {
        let validTicketCount = 0;
        let validTicketCountThisMonth = 0;
        let totalDaysThisMonth = 0;
        const totalDays = completedTickets.reduce((sum, ticket) => {
            const submitted = parseCustomDate(ticket.date);
            const completed = parseCustomDate(ticket.dateCompleted);

            if (submitted && completed) {
                // Ignore time components, compare just the dates
                const submittedDate = new Date(submitted.getFullYear(), submitted.getMonth(), submitted.getDate());
                const completedDate = new Date(completed.getFullYear(), completed.getMonth(), completed.getDate());

                if (completedDate >= submittedDate) {
                    const days = Math.round((completedDate - submittedDate) / (1000 * 60 * 60 * 24));
                    validTicketCount++;
                    
                    if (completed.getMonth() === currentMonth && completed.getFullYear() === currentYear) {
                        validTicketCountThisMonth++;
                        totalDaysThisMonth += days;
                    }
                    
                    return sum + days;
                }
            }
            return sum;
        }, 0);

        if (validTicketCount > 0) {
            avgResolutionDays = Math.round((totalDays / validTicketCount) * 10) / 10;
        }
        if (validTicketCountThisMonth > 0) {
            avgResolutionDaysThisMonth = Math.round((totalDaysThisMonth / validTicketCountThisMonth) * 10) / 10;
        }
    }

    return {
        total,
        open,
        inProgress,
        resolved,
        closed,
        active: open + inProgress,
        errorTypes,
        assignees,
        avgResolutionDays,
        avgResolutionDaysThisMonth
    };
}

/**
 * Export Moodle tickets to CSV format
 * @param {Array} tickets - Array of ticket objects
 * @returns {string} CSV string
 */
export function exportMoodleToCSV(tickets) {
    const headers = [
        'Date',
        'Ticket No',
        'Ticket Detail',
        'Contact Person',
        'Assigned To',
        'Error Type',
        'Status',
        'Date Started',
        'Date Completed'
    ];

    let csv = headers.join(',') + '\n';

    tickets.forEach(ticket => {
        const row = [
            ticket.date,
            ticket.ticketNo,
            `"${ticket.ticketDetail.replace(/"/g, '""')}"`, // Escape quotes
            ticket.contactPerson,
            ticket.assignedTo,
            ticket.errorType,
            ticket.status,
            ticket.dateStarted,
            ticket.dateCompleted
        ];
        csv += row.join(',') + '\n';
    });

    return csv;
}
