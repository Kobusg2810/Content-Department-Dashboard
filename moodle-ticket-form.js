// moodle-ticket-form.js
// Ticket submission form for the Moodle Support dashboard

// Configuration — team members and error types
const TEAM_MEMBERS = ['Jesaia', 'Lefentswe', 'Caroline', 'Gosiame', 'Anashya'];
const ERROR_TYPES = ['New TAP', 'LMS', 'Moodle', 'Certificates', 'Old TAP', 'Escalate', 'Loading Course', 'Loading Assessment'];
const STATUSES = ['Open', 'In Progress', 'Completed', 'Escalated'];

/**
 * Get the Apps Script URL from the global config
 * @returns {string} The Apps Script deployment URL
 */
function getAppsScriptUrl() {
    // This is set in app.js as a global
    return window.MOODLE_APPS_SCRIPT_URL || '';
}

/**
 * Create and show the ticket submission modal
 * @param {Function} onSuccess - Callback after successful submission
 */
export function showTicketModal(onSuccess) {
    // Remove existing modal if any
    const existing = document.getElementById('ticket-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'ticket-modal-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h2>
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 8px;">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    New Support Ticket
                </h2>
                <button class="modal-close" id="ticket-modal-close">&times;</button>
            </div>
            <form id="ticket-form" class="modal-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="ticket-date">Date & Time</label>
                        <input type="datetime-local" id="ticket-date" name="ticketDate" value="${new Date().toISOString().slice(0, 16)}">
                    </div>
                    <div class="form-group">
                        <label for="ticket-error-type">Error Type <span class="required">*</span></label>
                        <select id="ticket-error-type" name="errorType" required>
                            <option value="">— Select —</option>
                            ${ERROR_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="ticket-detail">Ticket Detail <span class="required">*</span></label>
                    <textarea id="ticket-detail" name="ticketDetail" rows="3" placeholder="Describe the issue..." required></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="ticket-contact">Contact Person <span class="required">*</span></label>
                        <input type="text" id="ticket-contact" name="contactPerson" placeholder="Who reported this?" required>
                    </div>
                    <div class="form-group">
                        <label for="ticket-assignee">Assigned To</label>
                        <select id="ticket-assignee" name="assignedTo">
                            <option value="Unassigned">— Select —</option>
                            ${TEAM_MEMBERS.map(m => `<option value="${m}">${m}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="ticket-status">Status</label>
                        <select id="ticket-status" name="status">
                            ${STATUSES.map(s => `<option value="${s}"${s === 'Open' ? ' selected' : ''}>${s}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn-cancel" id="ticket-cancel">Cancel</button>
                    <button type="submit" class="btn-submit" id="ticket-submit">
                        <span class="btn-text">Submit Ticket</span>
                        <span class="btn-loading" style="display:none;">
                            <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Submitting...
                        </span>
                    </button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
        overlay.classList.add('active');
    });

    // Close handlers
    const closeModal = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    };

    document.getElementById('ticket-modal-close').addEventListener('click', closeModal);
    document.getElementById('ticket-cancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });

    // Escape key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);

    // Form submission
    document.getElementById('ticket-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = document.getElementById('ticket-submit');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        // Show loading state
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        submitBtn.disabled = true;

        const ticketData = {
            ticketDetail: document.getElementById('ticket-detail').value.trim(),
            contactPerson: document.getElementById('ticket-contact').value.trim(),
            assignedTo: document.getElementById('ticket-assignee').value,
            errorType: document.getElementById('ticket-error-type').value,
            ticketDate: document.getElementById('ticket-date').value,
            status: document.getElementById('ticket-status').value,
        };

        try {
            const url = getAppsScriptUrl();
            if (!url) {
                throw new Error('Apps Script URL not configured. See MOODLE-TICKET-SETUP.md');
            }

            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(ticketData),
            });

            console.log('Ticket submission response status:', response.status);

            // With no-cors, we can't read the response, but if fetch didn't throw, it was sent
            showToast(`✅ Ticket submitted successfully!`, 'success');
            closeModal();

            // Refresh the ticket list after a short delay (let the sheet update)
            if (onSuccess) {
                setTimeout(() => onSuccess(), 3000);
            }

        } catch (error) {
            console.error('Ticket submission error:', error);
            showToast(`❌ ${error.message || 'Failed to submit ticket. Please try again.'}`, 'error');

            // Reset button
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
function showToast(message, type = 'success') {
    // Remove existing toast
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Create the "+ New Ticket" button HTML
 * @returns {string} HTML string for the button
 */
export function createNewTicketButton() {
    return `
        <button class="btn-new-ticket" id="newTicketBtn">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            New Ticket
        </button>
    `;
}
