
// Google Sheet URL for Moodle Loading content
const LOADING_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1R2ndYVWJMTBMVsaiOvVwKxG_2elkrgofX3ciXoR880o/export?format=csv&gid=702904795';

// Sample data for development/fallback
const sampleLoadingData = [
    {
        courseName: "Ergonomics Training",
        newCourseName: "Ergonomics Training",
        personDev3: "Lefentswe",
        personTap: "",
        mediaLoaded: "Done",
        structureLoaded: "Not Done",
        loadedBy: "Vukosi",
        lessonQuestions: "TRUE",
        examLoaded: "TRUE",
        units: 4,
        videos: 17,
        reviewFinish: "Done",
        courseComplete: "FALSE",
        startTime: "7:49",
        endTime: "9:30",
        duration: "2:20:30",
        checkedBy: ""
    }
];

/**
 * Fetch and parse loading data from Google Sheet
 */
export async function fetchLoadingData() {
    try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const url = `${LOADING_SHEET_URL}&t=${timestamp}`;

        console.log(`📥 Fetching Loading Data from: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch loading data: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        // innovative check for HTML login page disguised as 200 OK
        if (csvText.trim().startsWith('<') || csvText.includes('<!DOCTYPE html>')) {
            throw new Error('Received HTML instead of CSV. Sheet likely not published to web.');
        }

        console.log(`📄 Loading CSV length: ${csvText.length} chars`);

        return parseLoadingCSV(csvText);
    } catch (error) {
        console.error('Error fetching loading data:', error);
        console.warn('Falling back to sample loading data');
        return processLoadingData(sampleLoadingData);
    }
}

/**
 * Parse CSV text into structured loading objects
 */
function parseLoadingCSV(csvText) {
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
    if (rows.length < 2) {
        console.warn('⚠️ Log: CSV has fewer than 2 rows. Returning empty set.');
        return { courses: [], stats: {} };
    }

    console.log(`✅ Log: Parsed ${rows.length} rows from CSV.`);

    // Chunk 0 Analysis (New Format):
    // 0: Courses
    // 1: Total Units
    // 2: Total Videos
    // 3: Done
    // 4: Person to load Course (Dev3)

    const courses = rows.slice(1).map(row => {
        return {
            courseName: row[0] || '',
            newCourseName: '',
            personDev3: row[4] || '',
            personTap: '',
            mediaLoaded: '',      // Done/Not Done
            structureLoaded: '',  // Done/Not Done
            loadedBy: row[4] || '',
            lessonQuestions: '', // TRUE/FALSE
            examLoaded: '',      // TRUE/FALSE
            units: parseInt(row[1]) || 0,
            videos: parseInt(row[2]) || 0,
            reviewFinish: '',   // Done/Not Done
            courseComplete: row[3] || 'FALSE', // TRUE/FALSE
            startTime: '',
            endTime: '',
            duration: '',
            checkedBy: ''
        };
    }).filter(course => course.courseName); // Filter out empty rows

    // Deduplicate by course name (Google Sheets export sometimes duplicates the content)
    const uniqueCourses = [];
    const seenNames = new Set();
    for (const course of courses) {
        if (!seenNames.has(course.courseName)) {
            uniqueCourses.push(course);
            seenNames.add(course.courseName);
        }
    }

    console.log(`✅ Log: First Parsed Course:`, uniqueCourses[0]);
    return processLoadingData(uniqueCourses);
}

/**
 * Process courses to calculate stats
 */
function processLoadingData(rawCourses) {
    const processedCourses = rawCourses.map(course => {
        let status = 'Not Started';

        // Check completion
        if (['TRUE', 'YES', 'DONE'].includes(course.courseComplete.toUpperCase())) {
            status = 'Completed';
        } else if (['Done', 'TRUE'].includes(course.reviewFinish)) {
            status = 'Completed'; // Fallback check
        } else if (course.startTime && course.startTime.trim() !== '') {
            status = 'In Progress';
        } else if (['Done', 'TRUE'].includes(course.mediaLoaded) || ['Done', 'TRUE'].includes(course.structureLoaded)) {
            // Partially done but no start time logged? Treat as In Progress
            status = 'In Progress';
        }

        // Check Review Pending
        if (status === 'In Progress' &&
            ['Done', 'TRUE'].includes(course.mediaLoaded) &&
            ['Done', 'TRUE'].includes(course.structureLoaded) &&
            ['TRUE'].includes(course.examLoaded)) {
            status = 'Review Pending';
        }

        return {
            ...course,
            status
        };
    });

    // Calculate Stats
    const stats = {
        total: processedCourses.length,
        completed: processedCourses.filter(c => c.status === 'Completed').length,
        inProgress: processedCourses.filter(c => c.status === 'In Progress').length,
        reviewPending: processedCourses.filter(c => c.status === 'Review Pending').length,
        notStarted: processedCourses.filter(c => c.status === 'Not Started').length,

        // Detailed Metrics
        mediaDone: processedCourses.filter(c => ['Done', 'TRUE'].includes(c.mediaLoaded)).length,
        structureDone: processedCourses.filter(c => ['Done', 'TRUE'].includes(c.structureLoaded)).length,
        examDone: processedCourses.filter(c => ['TRUE', 'YES'].includes(c.examLoaded)).length,

        // Breakdowns
        byLoader: {}
    };

    // Aggregate for charts
    processedCourses.forEach(c => {
        // Loaded By (primary) or Person Assigned
        const loader = c.loadedBy || c.personDev3 || 'Unassigned';
        if (!stats.byLoader[loader]) {
            stats.byLoader[loader] = { total: 0, completed: 0 };
        }
        stats.byLoader[loader].total++;
        if (c.status === 'Completed') {
            stats.byLoader[loader].completed++;
        }
    });

    return {
        courses: processedCourses,
        stats
    };
}
