/**
 * ============================================
 * SPYFALL ONLINE - ADMIN.JS
 * Admin Panel - Manage Locations & Roles
 * ============================================
 */

const AdminManager = {
    // Local copy of locations for editing
    locations: [],
    editingIndex: -1,

    /**
     * Initialize admin panel
     * Load locations from GameManager
     */
    init() {
        this.locations = [...GameManager.state.locations];
        this.renderLocations();
        this.bindEvents();
    },

    /**
     * Bind admin event listeners
     */
    bindEvents() {
        // Add location button
        const btnAdd = document.getElementById('btn-add-location');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => this.showModal());
        }

        // Import JSON
        const btnImport = document.getElementById('btn-import-json');
        const fileInput = document.getElementById('file-import');
        if (btnImport && fileInput) {
            btnImport.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.importJSON(e));
        }

        // Export JSON
        const btnExport = document.getElementById('btn-export-json');
        if (btnExport) {
            btnExport.addEventListener('click', () => this.exportJSON());
        }

        // Save location
        const btnSave = document.getElementById('btn-save-location');
        if (btnSave) {
            btnSave.addEventListener('click', () => this.saveLocation());
        }

        // Cancel modal
        const btnCancel = document.getElementById('btn-cancel-location');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => this.hideModal());
        }
    },

    /**
     * Render locations list in admin panel
     */
    renderLocations() {
        const container = document.getElementById('locations-list');
        if (!container) return;

        container.innerHTML = this.locations.map((loc, index) => `
            <div class="location-item">
                <div>
                    <div class="loc-name">${loc.name}</div>
                    <div class="loc-roles">${loc.roles.length} roles: ${loc.roles.slice(0, 3).join(', ')}...</div>
                </div>
                <div class="loc-actions">
                    <button class="loc-btn-edit" onclick="AdminManager.editLocation(${index})">✏️ Edit</button>
                    <button class="loc-btn-delete" onclick="AdminManager.deleteLocation(${index})">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Show add/edit modal
     * @param {number} index - Index to edit (-1 for new)
     */
    showModal(index = -1) {
        this.editingIndex = index;
        const modal = document.getElementById('modal-location');
        const title = document.getElementById('modal-title');
        const nameInput = document.getElementById('input-location-name');
        const rolesInput = document.getElementById('input-roles');

        if (index >= 0) {
            // Edit mode
            const loc = this.locations[index];
            title.textContent = 'Edit Location';
            nameInput.value = loc.name;
            rolesInput.value = loc.roles.join('\n');
        } else {
            // Add mode
            title.textContent = 'Add Location';
            nameInput.value = '';
            rolesInput.value = '';
        }

        modal.style.display = 'flex';
    },

    /**
     * Hide modal
     */
    hideModal() {
        const modal = document.getElementById('modal-location');
        if (modal) modal.style.display = 'none';
        this.editingIndex = -1;
    },

    /**
     * Edit a location
     * @param {number} index - Location index
     */
    editLocation(index) {
        this.showModal(index);
    },

    /**
     * Delete a location
     * @param {number} index - Location index
     */
    deleteLocation(index) {
        if (confirm(`Delete "${this.locations[index].name}"?`)) {
            this.locations.splice(index, 1);
            this.syncLocations();
            this.renderLocations();
            showToast('Location deleted', 'success');
        }
    },

    /**
     * Save location (add or update)
     */
    saveLocation() {
        const nameInput = document.getElementById('input-location-name');
        const rolesInput = document.getElementById('input-roles');

        const name = nameInput.value.trim();
        const roles = rolesInput.value.split('\n').map(r => r.trim()).filter(r => r.length > 0);

        // Validation
        if (!name) {
            showToast('Please enter a location name', 'error');
            return;
        }

        if (roles.length < 8) {
            showToast('Need at least 8 roles', 'error');
            return;
        }

        const locationData = { name, roles };

        if (this.editingIndex >= 0) {
            // Update existing
            this.locations[this.editingIndex] = locationData;
            showToast('Location updated!', 'success');
        } else {
            // Add new
            // Check for duplicate
            if (this.locations.some(l => l.name.toLowerCase() === name.toLowerCase())) {
                showToast('Location already exists!', 'error');
                return;
            }
            this.locations.push(locationData);
            showToast('Location added!', 'success');
        }

        this.syncLocations();
        this.renderLocations();
        this.hideModal();
    },

    /**
     * Sync locations back to GameManager
     */
    syncLocations() {
        GameManager.state.locations = [...this.locations];
    },

    /**
     * Import locations from JSON file
     * @param {Event} event - File input change event
     */
    importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Validate structure
                if (!Array.isArray(data)) {
                    throw new Error('JSON must be an array of locations');
                }

                data.forEach((loc, i) => {
                    if (!loc.name || !Array.isArray(loc.roles)) {
                        throw new Error(`Invalid location at index ${i}`);
                    }
                });

                // Merge or replace
                const action = confirm(
                    `Import ${data.length} locations?\n\nOK = Replace all\nCancel = Merge with existing`
                );

                if (action) {
                    this.locations = data;
                } else {
                    // Merge - add only new ones
                    const existingNames = this.locations.map(l => l.name.toLowerCase());
                    const newLocations = data.filter(l => !existingNames.includes(l.name.toLowerCase()));
                    this.locations = [...this.locations, ...newLocations];
                    showToast(`Added ${newLocations.length} new locations`, 'success');
                }

                this.syncLocations();
                this.renderLocations();
                showToast('Import successful!', 'success');
            } catch (error) {
                showToast(`Import error: ${error.message}`, 'error');
            }
        };
        reader.readAsText(file);

        // Reset input
        event.target.value = '';
    },

    /**
     * Export locations to JSON file
     */
    exportJSON() {
        const json = JSON.stringify(this.locations, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'spyfall_locations.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Exported successfully!', 'success');
    }
};
