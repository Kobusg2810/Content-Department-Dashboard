
// client-projects-data.js

// URL for TAP Client Projects Google Sheet (CSV Export)
const CLIENT_PROJECTS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1pPLg73v48miIY48XEbP8NdWp1fUB9zBJBlDy3F8X4Ys/export?format=csv&gid=0';

export async function fetchClientProjectsData() {
    console.log(`📥 Fetching Client Projects Data from: ${CLIENT_PROJECTS_CSV_URL}`);

    try {
        const response = await fetch(CLIENT_PROJECTS_CSV_URL + '&t=' + new Date().getTime());
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const csvText = await response.text();
        console.log(`📄 Client Projects CSV length: ${csvText.length} chars`);

        // Check for HTML response (login page/permissions error)
        if (csvText.trim().startsWith('<') || csvText.includes('<!DOCTYPE html>')) {
            throw new Error('Received HTML instead of CSV. Check Google Sheet permissions (Must be "Published to Web").');
        }

        return parseClientProjectsCSV(csvText);

    } catch (error) {
        console.error('🛑 Error loading Client Projects data:', error);
        return { projects: [], stats: {} }; // Return empty data structure on error
    }
}

function parseClientProjectsCSV(csvText) {
    // Remove header
    // The previous split('\n') might have been broken by newlines inside quoted fields (like the headers!)
    // Let's use a smarter regex to find the start of data.

    // We expect the first valid data row to start after the header line.
    // The header line starts with "Project Name".
    // But since we can't trust line splitting on raw text easily with multi-line headers/values,
    // let's rely on the structure.

    const lines = csvText.split(/\r?\n/);

    // Find the header row index
    const headerIndex = lines.findIndex(line => line.startsWith('Project Name'));

    if (headerIndex === -1) {
        console.error('❌ Log: Could not find header row "Project Name"');
        return processClientProjectsData([]);
    }

    // Data starts after header
    // Note: If header spans multiple lines (it shouldn't in CSV export usually, but cell content might),
    // basic split might be risky. But standard Google CSV export usually escapes properly.

    const dataRows = lines.slice(headerIndex + 1);
    console.log(`Log: Found header at line ${headerIndex}. Processing ${dataRows.length} potential rows.`);

    const projects = dataRows.map(row => {
        // Handle quoted fields containing commas
        // This simple regex split is fragile for complex CSVs but works for standard Google Sheets simple text
        // A better approach for "Uploaded to \n Moodle" is needed if that was in the DATA, not just header.

        // Let's try to be more robust:
        // Match standard CSV pattern: "value", or value
        const matches = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

        // Fallback to simple split if regex fails or returns odd results
        const minColumns = 8;
        let columns = [];

        if (row.includes('"')) {
            // Complex parsing for quoted values
            columns = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
            // Clean quotes
            columns = columns.map(c => c.replace(/^"|"$/g, '').trim());
        } else {
            columns = row.split(',');
        }

        // If simple split seems safer:
        // Google CSVs are usually good.
        // Let's stick to the previous simple split but log failures.
        const simpleCols = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());

        if (simpleCols.length < 5) return null; // Skip empty/malformed rows

        return {
            name: simpleCols[0],
            client: simpleCols[1],
            owner: simpleCols[2],
            platform: simpleCols[3],
            month: simpleCols[4],
            totalVideos: parseInt(simpleCols[5]) || 0,
            length: simpleCols[6],
            finalised: (simpleCols[7] || '').toUpperCase() === 'TRUE',
            moodle: (simpleCols[8] || '').toUpperCase() === 'TRUE',
            sharepoint: (simpleCols[9] || '').toUpperCase() === 'TRUE',
            link: simpleCols[10]
        };
    }).filter(p => p && p.name); // Filter out nulls and empty names

    console.log(`✅ Log: Parsed ${projects.length} valid projects from ${dataRows.length} lines.`);
    if (projects.length > 0) {
        console.log('Sample Project:', projects[0]);
    }

    return processClientProjectsData(projects);
}

function processClientProjectsData(projects) {
    const stats = {
        totalProjects: projects.length,
        finalised: projects.filter(p => p.finalised).length,
        inProgress: projects.filter(p => !p.finalised).length,
        totalVideos: projects.reduce((sum, p) => sum + p.totalVideos, 0),

        // Breakdowns
        byPlatform: {},
        byOwner: {},
        byClient: {}
    };

    projects.forEach(p => {
        // Platform Stats
        const platform = p.platform || 'Unknown';
        stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + 1;

        // Owner Stats
        const owner = p.owner || 'Unassigned';
        stats.byOwner[owner] = (stats.byOwner[owner] || 0) + 1;

        // Client Stats
        const client = p.client || 'Unknown';
        stats.byClient[client] = (stats.byClient[client] || 0) + 1;
    });

    return { projects, stats };
}
