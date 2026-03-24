
// Google Sheet URL for Course Development content
const COURSE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1RDlLGJtzybQfqjXiIYtqAVE3v3acA2qlkmbPW8jecK0/export?format=csv';

// Sample data for development/fallback
export const sampleCourseData = [
    {
        courseName: "Ergonomics Training",
        category: "Client",
        clientName: "PEG",
        contactPerson: "Anandi",
        clientApproval: "FALSE",
        dueDate: "20/02/2026",
        dateStarted: "13/02/2026",
        dateCompleted: "",
        contentReviewed: "",
        reviewedBy: "",
        status: "In Progress" // Inferred
    },
    {
        courseName: "Poultry Processing",
        category: "Legacy",
        clientName: "SpecCon",
        contactPerson: "Linda",
        clientApproval: "FALSE",
        dueDate: "",
        dateStarted: "",
        dateCompleted: "",
        contentReviewed: "FALSE",
        reviewedBy: "",
        status: "Not Started" // Inferred
    }
];

/**
 * Fetch and parse course data from Google Sheet
 */
export async function fetchCourseData() {
    try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const url = `${COURSE_SHEET_URL}&t=${timestamp}`;

        console.log(`📥 Fetching Course Data from: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch course data: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();
        console.log(`📄 Course CSV length: ${csvText.length} chars`);

        return parseCourseCSV(csvText);
    } catch (error) {
        console.error('Error fetching course data:', error);
        console.warn('Falling back to sample course data');
        return processCourses(sampleCourseData);
    }
}

/**
 * Parse CSV text into structured course objects
 */
function parseCourseCSV(csvText) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;

    // Parse CSV handling quoted fields with commas
    for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];

        if (char === '"') {
            if (insideQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                insideQuotes = !insideQuotes;
            }
        } else if (char === ',' && !insideQuotes) {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if (char === '\n' && !insideQuotes) {
            if (currentField || currentRow.length > 0) {
                currentRow.push(currentField.trim());
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            }
        } else if (char === '\r') {
            continue;
        } else {
            currentField += char;
        }
    }

    // Handle last row
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }

    // Extract headers (first row)
    if (rows.length < 2) return { courses: [], stats: {} };

    // Map CSV rows to objects
    // Expected Columns based on analysis:
    // 0: Course Name
    // 1: Category (Client/TAP/QCTO/Legacy)
    // 2: Client Name
    // 3: Contact Person
    // 4: Client Approval
    // 5: Due Date
    // 6: Date Started
    // 7: Date Completed
    // 8: Content Reviewed
    // 9: Reviewed By
    // 10: Status

    const courses = rows.slice(1).map(row => {
        return {
            courseName: row[0] || '',
            category: row[1] || 'Uncategorized',
            clientName: row[2] || '',
            contactPerson: row[3] || '',
            clientApproval: row[4] || 'FALSE',
            dueDate: row[5] || '',
            dateStarted: row[6] || '',
            dateCompleted: row[7] || '',
            contentReviewed: row[8] || '',
            reviewedBy: row[9] || '',
            originalStatus: row[10] || ''
        };
    }).filter(course => course.courseName); // Filter out empty rows

    return processCourses(courses);
}

/**
 * Process courses to add inferred status and calculate stats
 */
function processCourses(rawCourses) {
    const today = new Date();

    // robust date parser (same as used in Moodle)
    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`); // YYYY-MM-DD
            }
        }
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? null : d;
    };

    const processedCourses = rawCourses.map(course => {
        let status = 'Not Started';
        let isOverdue = false;

        const startDate = parseDate(course.dateStarted);
        const completeDate = parseDate(course.dateCompleted);
        const dueDate = parseDate(course.dueDate);

        // Determine Status
        // Determine Status
        if (completeDate) {
            // Check if content is reviewed
            const isReviewed = course.contentReviewed && ['TRUE', 'YES', '1'].includes(course.contentReviewed.toUpperCase());
            if (isReviewed) {
                status = 'Completed';
            } else {
                status = 'Reviewed'; // Formerly "Ready for Review"
            }
        } else if (startDate) {
            status = 'In Progress';
        } else if (course.originalStatus && course.originalStatus.trim().toLowerCase() === 'in progress') {
            status = 'In Progress';
        } else if (course.clientApproval && course.clientApproval.toUpperCase() === 'FALSE') {
            // If explicit "Wait for Approval" data exists, we could use it
            // checking logic: if not started and approval is false?
            // For now, adhere to primary dates logic, maybe add a flag
        }

        // Check Overdue
        if (dueDate && !completeDate && dueDate < today) {
            isOverdue = true;
            // Removed status override so tasks stay 'In Progress' for stats count
        }

        return {
            ...course,
            status,
            isOverdue,
            jsDueDate: dueDate,
            jsStartDate: startDate,
            jsCompleteDate: completeDate
        };
    });

    // Calculate Stats
    const stats = {
        total: processedCourses.length,
        completed: processedCourses.filter(c => c.status === 'Completed').length,
        reviewed: processedCourses.filter(c => c.status === 'Reviewed').length,
        inProgress: processedCourses.filter(c => c.status === 'In Progress').length,
        notStarted: processedCourses.filter(c => c.status === 'Not Started').length,

        // Breakdowns for charts
        byCategory: {},
        byClient: {}
    };

    // Aggregate for charts
    processedCourses.forEach(c => {
        // Category
        const cat = c.category || 'Other';
        stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;

        // Client (only top ones)
        const client = c.clientName || 'Unknown';
        stats.byClient[client] = (stats.byClient[client] || 0) + 1;
    });

    return {
        courses: processedCourses,
        stats
    };
}
