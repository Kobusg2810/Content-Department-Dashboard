/**
 * Parse qualification name to extract code (for special processing if needed)
 * @param {string} qualName - Qualification name
 * @returns {string} Cleaned qualification code
 */
function extractQualificationCode(qualName) {
    // Example: "Project Manager" -> "PROJECT_MANAGER"
    return qualName.toUpperCase().replace(/\s+/g, '_');
}

/**
 * Fetch QCTO data from Google Sheets (SUMMARY TAB VIEW)
 * @param {string} sheetUrl - Google Sheet URL
 * @returns {Promise<Array>} Array of qualification objects
 */
export async function fetchQCTOData(sheetUrl) {
    try {
        // Hardcoded to use summary tab gid=1203721967
        const csvUrl = `https://docs.google.com/spreadsheets/d/14pEQHY3stCEzrDry8bnIosh1SLNAarYHZFuH1-XlNX4/export?format=csv&gid=1203721967`;

        const response = await fetch(csvUrl);

        if (!response.ok) {
            throw new Error('Failed to fetch data from Google Sheets. Make sure the sheet is publicly accessible.');
        }

        const csvData = await response.text();
        const parsedData = parseCSVToQCTO(csvData);

        return parsedData;

    } catch (error) {
        console.error('Error fetching QCTO data:', error);
        throw error;
    }
}

/**
 * Parse CSV data to QCTO qualification objects - SUMMARY TAB FORMAT
 * @param {string} csvData - Raw CSV string
 * @returns {Array} Array of qualification objects
 */
function parseCSVToQCTO(csvData) {
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
                if (currentRow.some(f => f.length > 0)) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentField = '';
            }
        } else if (char === '\r') {
            continue;
        } else {
            currentField += char;
        }
    }

    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f.length > 0)) {
            rows.push(currentRow);
        }
    }

    console.log(`📄 QCTO Summary CSV parsed into ${rows.length} rows`);
    console.log(`📋 Row 0:`, rows[0]);
    console.log(`📋 Row 1:`, rows[1]);
    console.log(`📋 Row 2:`, rows[2]);
    console.log(`📋 Row 3:`, rows[3]);

    // Summary tab format:
    // Column 0: Release date
    // Column 1: Qualification
    // Column 2: Percentage Done
    // Column 3: Comments
    // Column 4: Assigned To
    // Column 5: Done (boolean)
    // Column 6: Loaded on moodle (boolean)
    // Column 7: Created on LMS (boolean)

    // Start from row 1 to skip only the header row
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];

        // Skip rows with insufficient columns
        if (!values || values.length < 6) {
            continue;
        }

        const qualName = values[1]?.trim();

        // Skip if qualification name is empty or is a header
        if (!qualName || qualName.toLowerCase().includes('qualification')) {
            continue;
        }

        const percentDone = values[2]?.trim() || '0%';
        const assignedTo = values[4]?.trim() || '';
        const done = parseBooleanValue(values[5]);
        const loadedOnMoodle = parseBooleanValue(values[6]);
        const createdOnLMS = parseBooleanValue(values[7]);

        // For summary view, we use "Done" as proxy for alignment stages
        // and the other columns for Moodle/LMS status
        const obj = {
            qualificationName: qualName,
            qualificationID: '', // Not in summary tab
            modules: '', // Not in summary tab
            iacAligned: done, // Using "Done" as proxy for IAC
            aacAligned: done, // Using "Done" as proxy for AAC  
            loadedOnMoodle: loadedOnMoodle,
            learnerGuideChecked: done, // Using "Done" as proxy
            courseActivitiesCreated: createdOnLMS,
            contentReviewed: done, // Using "Done" as proxy
            alignmentMatrixCorrected: done, // "Done" column
            assignedTo: assignedTo,
            percentDone: percentDone,
            moduleDetails: [] // No module details in summary view
        };

        data.push(obj);
    }

    console.log(`✅ Parsed ${data.length} QCTO qualifications from summary tab`);

    // Filter out SHE Rep Compliance as requested (case-insensitive)
    const filtered = data.filter(q => {
        const name = q.qualificationName.toUpperCase();
        return !name.includes('SHE REP');
    });
    console.log(`✅ Filtered to ${filtered.length} qualifications (removed ${data.length - filtered.length} items)`);

    return filtered;
}

/**
 * Helper function to parse boolean values from various formats
 * @param {string|boolean} value - Value to parse
 * @returns {boolean} Parsed boolean
 */
function parseBooleanValue(value) {
    if (typeof value === 'boolean') return value;
    if (!value) return false;

    const str = String(value).toLowerCase().trim();
    return str === 'true' || str === 'yes' || str === '1' || str === 'x' || str === '✓';
}

/**
 * Calculate completion percentage for a qualification
 * @param {Object} qual - Qualification object
 * @returns {number} Completion percentage (0-100)
 */
export function calculateCompletion(qual) {
    // If we have detailed module data (from background sync), use that for accuracy
    if (qual.moduleDetails && qual.moduleDetails.length > 0) {
        let totalChecks = 0;
        let completedChecks = 0;

        qual.moduleDetails.forEach(mod => {
            totalChecks += 7;
            if (mod.iacAligned) completedChecks++;
            if (mod.aacAligned) completedChecks++;
            if (mod.loadedOnMoodle) completedChecks++;
            if (mod.learnerGuideChecked) completedChecks++;
            if (mod.courseActivitiesCreated) completedChecks++;
            if (mod.contentReviewed) completedChecks++;
            if (mod.alignmentMatrixCorrected) completedChecks++;
        });

        if (totalChecks === 0) return 0;
        return Math.round((completedChecks / totalChecks) * 100);
    }

    // Fallback to summary sheet data (less accurate)
    const stages = [
        qual.iacAligned,
        qual.aacAligned,
        qual.loadedOnMoodle,
        qual.learnerGuideChecked,
        qual.courseActivitiesCreated,
        qual.contentReviewed,
        qual.alignmentMatrixCorrected
    ];

    const completed = stages.filter(Boolean).length;
    return Math.round((completed / stages.length) * 100);
}

/**
 * Calculate overall statistics for QCTO qualifications
 * @param {Array} qualifications - Array of qualification objects
 * @returns {Object} Statistics object
 */
export function calculateStats(qualifications) {
    const total = qualifications.length;

    const completed = qualifications.filter(q => calculateCompletion(q) === 100).length;
    const inProgress = qualifications.filter(q => {
        const completion = calculateCompletion(q);
        return completion > 0 && completion < 100;
    }).length;
    const notStarted = qualifications.filter(q => calculateCompletion(q) === 0).length;

    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Stage completion rates
    const iacCompletion = qualifications.filter(q => q.iacAligned).length;
    const aacCompletion = qualifications.filter(q => q.aacAligned).length;
    const moodleCompletion = qualifications.filter(q => q.loadedOnMoodle).length;
    const guideCompletion = qualifications.filter(q => q.learnerGuideChecked).length;
    const activitiesCompletion = qualifications.filter(q => q.courseActivitiesCreated).length;
    const reviewCompletion = qualifications.filter(q => q.contentReviewed).length;
    const matrixCompletion = qualifications.filter(q => q.alignmentMatrixCorrected).length;

    return {
        total,
        completed,
        inProgress,
        notStarted,
        completionPercentage,
        stageStats: {
            iacAligned: iacCompletion,
            aacAligned: aacCompletion,
            loadedOnMoodle: moodleCompletion,
            learnerGuideChecked: guideCompletion,
            courseActivitiesCreated: activitiesCompletion,
            contentReviewed: reviewCompletion,
            alignmentMatrixCorrected: matrixCompletion
        }
    };
}

/**
 * Export qualifications data to CSV format
 * @param {Array} qualifications - Array of qualification objects
 * @returns {string} CSV string
 */
export function exportToCSV(qualifications) {
    const headers = [
        'Qualification Name',
        'ID',
        'Modules',
        'IAC Aligned',
        'AAC Aligned',
        'Loaded on Moodle',
        'LG Checked',
        'Activities Created',
        'Content Reviewed',
        'Alignment Matrix',
        'Completion %'
    ];

    const rows = qualifications.map(qual => [
        qual.qualificationName,
        qual.qualificationID,
        qual.modules,
        qual.iacAligned ? 'Yes' : 'No',
        qual.aacAligned ? 'Yes' : 'No',
        qual.loadedOnMoodle ? 'Yes' : 'No',
        qual.learnerGuideChecked ? 'Yes' : 'No',
        qual.courseActivitiesCreated ? 'Yes' : 'No',
        qual.contentReviewed ? 'Yes' : 'No',
        qual.alignmentMatrixCorrected ? 'Yes' : 'No',
        calculateCompletion(qual) + '%'
    ]);

    return [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
}

/**
 * Download CSV file
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Filename for download
 */
export function downloadCSV(csvContent, filename = 'qcto_qualifications.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Fetch module details for a specific qualification from its individual tab
 * @param {string} qualificationName - Name of the qualification
 * @param {string} gid - Google Sheet GID for the qualification's tab
 * @returns {Promise<Array>} Array of module objects with detailed status
 */
export async function fetchModuleDetails(qualificationName, gid) {
    try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/14pEQHY3stCEzrDry8bnIosh1SLNAarYHZFuH1-XlNX4/export?format=csv&gid=${gid}`;

        const response = await fetch(csvUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch module details for ${qualificationName}`);
        }

        const csvData = await response.text();
        return parseModuleCSV(csvData, qualificationName);

    } catch (error) {
        console.error(`Error fetching module details for ${qualificationName}:`, error);
        return [];
    }
}

/**
 * Parse module-level CSV data from individual qualification tabs
 * @param {string} csvData - Raw CSV string
 * @param {string} qualName - Qualification name for filtering
 * @returns {Array} Array of module objects
 */
function parseModuleCSV(csvData, qualName) {
    const modules = [];
    const rows = [];

    // Parse CSV with same logic as summary parser
    let currentRow = [];
    let currentField = '';
    let insideQuotes = false;

    for (let i = 0; i < csvData.length; i++) {
        const char = csvData[i];
        const nextChar = csvData[i + 1];

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
                if (currentRow.some(f => f.length > 0)) {
                    rows.push(currentRow);
                }
                currentRow = [];
                currentField = '';
            }
        } else if (char === '\r') {
            continue;
        } else {
            currentField += char;
        }
    }

    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f.length > 0)) {
            rows.push(currentRow);
        }
    }

    console.log(`📋 Module CSV for ${qualName}: ${rows.length} rows`);

    // Module tab structure (from Project Manager example):
    // Col 0: Learnership/Qualification
    // Col 3: Module (KM 1, KM 2, etc.)
    // Col 8: IAC Aligned
    // Col 10: AAC Aligned
    // Col 16: Done (Loaded on Moodle)
    // Col 18: Done (Learner Guide Checked)
    // Col 20: Done (Activities Created)
    // Col 22: Done (Content Reviewed)
    // Col 24: Done (Alignment Matrix)


    // Start from row 1 - handles both sheet structures (some have KM 1 in row 1, others in row 2)
    for (let i = 1; i < rows.length; i++) {
        const values = rows[i];

        // Need at least 11 columns to parse basic module info (name, IAC, AAC)
        if (!values || values.length < 11) {
            console.log(`⚠️ Skipping row ${i} for ${qualName}: has ${values?.length || 0} columns (need 11+)`);
            continue;
        }

        const moduleName = values[3]?.trim();

        if (!moduleName || moduleName.toLowerCase() === 'modules') {
            console.log(`⚠️ Skipping row ${i} for ${qualName}: empty module name`);
            continue;
        }

        modules.push({
            name: moduleName,
            iacAligned: parseBooleanValue(values[8]),
            aacAligned: parseBooleanValue(values[10]),
            loadedOnMoodle: parseBooleanValue(values[16]),      // Was 14, should be 16
            learnerGuideChecked: parseBooleanValue(values[18]),  // Was 16, should be 18
            courseActivitiesCreated: parseBooleanValue(values[20]), // Was 18, should be 20
            contentReviewed: parseBooleanValue(values[22]),      // Was 20, should be 22
            alignmentMatrixCorrected: parseBooleanValue(values[24]) // Was 22, should be 24
        });
    }

    console.log(`✅ Parsed ${modules.length} modules for ${qualName}`);
    return modules;
}

/**
 * Fetch detailed module data for ALL qualifications sequentially
 * Used for background sync to get accurate stats
 * @param {Array} qualifications - Array of qualification objects
 * @param {Function} onProgress - Callback function(qualName, modules) called after each fetch
 */
export async function fetchAllModuleDetails(qualifications, onProgress) {
    console.log('🔄 Starting background sync of module details...');

    // Process one by one to avoid rate limits
    for (const qual of qualifications) {
        // Skip if we already have modules (shouldn't happen on init but good practice)
        if (qual.moduleDetails && qual.moduleDetails.length > 0) continue;

        const gid = await import('./qualification-gids.js').then(m => m.getQualificationGID(qual.qualificationName));

        if (gid) {
            try {
                const modules = await fetchModuleDetails(qual.qualificationName, gid);
                if (modules && modules.length > 0) {
                    onProgress(qual.qualificationName, modules);
                }
                // Small delay to be nice to Google Sheets API
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                console.warn(`Failed to sync details for ${qual.qualificationName}`, err);
            }
        }
    }

    console.log('✅ Background sync complete!');
}
