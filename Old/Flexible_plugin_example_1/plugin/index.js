const { app, core, action, constants } = require('photoshop');
const { localFileSystem } = require('uxp').storage;

// Globals
let selectedScriptEntry = null;
let selectedScriptFolder = null; // This will store the currently active script folder (default or user-selected)
let selectedLayers = [];

// UI Elements - Main Plugin View
let scriptSelect, refreshScriptsBtn, settingsBtn, layerListContainer, refreshLayersBtn, runScriptBtn, batchProcessBtn, statusLog, loadingIndicator; // Removed selectScriptFolderBtn

// UI Elements - Views
const landingView = document.getElementById('landing-view');
const mainPluginView = document.getElementById('main-plugin-view');
const enterMainPluginBtn = document.getElementById('enter-main-plugin-btn');

// --- View Switching and Initialization ---
function showMainPluginView() {
    console.log('Attempting to show main plugin view');
    if (landingView) landingView.classList.add('hidden-view');
    if (mainPluginView) mainPluginView.classList.remove('hidden-view');

    // Initialize main plugin UI elements and logic only once
    if (!scriptSelect) { // Check if already initialized
        initializeMainPluginUI();
        initializeMainPluginLogic();
    }
}

function initializeMainPluginUI() {
    console.log('Initializing Main Plugin UI elements');
    // Get references to main plugin UI elements
    scriptSelect = document.getElementById('script-select');
    refreshScriptsBtn = document.getElementById('refresh-scripts-btn');
    settingsBtn = document.getElementById('settings-btn'); // Added settingsBtn
    // selectScriptFolderBtn = document.getElementById('select-script-folder-btn'); // Removed
    layerListContainer = document.getElementById('layer-list');
    refreshLayersBtn = document.getElementById('refresh-layers-btn');
    runScriptBtn = document.getElementById('run-script-btn');
    batchProcessBtn = document.getElementById('batch-process-btn');
    statusLog = document.getElementById('status-log');
    loadingIndicator = document.getElementById('loading-indicator');

    if (!scriptSelect) {
        console.error("Failed to find scriptSelect element during main plugin UI init.");
        // Potentially halt further initialization or show an error to the user
        return;
    }
    // ... add checks for other critical elements if necessary
}

function initializeMainPluginLogic() {
    console.log('Initializing Main Plugin Logic');
    if (!scriptSelect) {
        console.error("Cannot initialize main plugin logic - UI elements not found.");
        logStatus("Critical error: Main UI elements not found. Plugin may not function.", true);
        return;
    }
    loadDefaultScripts();
    refreshLayerList();
    setupEventListeners(); // Sets up listeners for main plugin buttons
    logStatus('Plugin panel script loaded and main interface initialized.');
}


// Initial setup: Event listener for the landing page button
if (enterMainPluginBtn) {
    console.log('"Enter Plugin" button found, attaching listener.');
    enterMainPluginBtn.addEventListener('click', showMainPluginView);
} else {
    console.error('"Enter Plugin" button (enter-main-plugin-btn) not found. Check index.html.');
    // If the button isn't found, the plugin is stuck on the (invisible) landing view.
    // For development, you might want to directly show the main view or log a very visible error.
    // showMainPluginView(); // Uncomment for dev if landing button is missing to bypass
}


// --- Event Listeners for Main Plugin ---
function setupEventListeners() {
    // Ensure elements are available before adding listeners
    if (!settingsBtn || !refreshScriptsBtn || !scriptSelect || !refreshLayersBtn || !runScriptBtn || !batchProcessBtn) { // Replaced selectScriptFolderBtn with settingsBtn
        console.error('One or more main plugin UI elements are missing. Cannot setup event listeners.');
        logStatus('Error: Could not set up all interactions. Some buttons may not work.', true);
        return;
    }
    console.log('Setting up event listeners for main plugin elements.');
    settingsBtn.addEventListener('click', selectScriptFolderViaSettings); // Changed to settingsBtn and new handler
    refreshScriptsBtn.addEventListener('click', loadScriptsFromSelectedFolder);
    scriptSelect.addEventListener('change', handleScriptSelection);
    refreshLayersBtn.addEventListener('click', refreshLayerList);
    runScriptBtn.addEventListener('click', runScriptOnSelectedLayers);
    batchProcessBtn.addEventListener('click', batchProcessFiles);
}

function logStatus(message, isError = false) {
    const timestamp = new Date().toLocaleTimeString();
    if (statusLog) { // Check if statusLog is initialized
        statusLog.value += `[${timestamp}] ${message}\n`;
        // Auto-scroll for sp-textfield (its internal textarea)
        const textarea = statusLog.shadowRoot?.querySelector('textarea');
        if (textarea) {
            textarea.scrollTop = textarea.scrollHeight;
        }
    } else {
        // Fallback if statusLog isn't ready (e.g., error before main UI init)
        console.log(`Status Log (not ready): [${timestamp}] ${message}`);
    }

    if (isError) {
        console.error(message);
    }
}

// --- Script Handling ---
async function loadDefaultScripts() {
    // This function now tries to load from a 'scripts' subfolder in the plugin directory
    // If selectedScriptFolder is already set (e.g., by user via settings), it will use that.
    if (!selectedScriptFolder) {
        try {
            const pluginFolder = await localFileSystem.getPluginFolder();
            const scriptsDir = await pluginFolder.getEntry('scripts');
            if (scriptsDir && scriptsDir.isFolder) {
                selectedScriptFolder = scriptsDir; // Set the default script folder
                logStatus('Default "scripts" folder found and set.');
            } else {
                logStatus('Default "scripts" folder not found. Use settings to select a script folder.', true);
            }
        } catch (e) {
            logStatus('Could not access default "scripts" folder. Use settings to select one.', true);
        }
    }

    if (selectedScriptFolder) {
        await loadScriptsFromFolder(selectedScriptFolder);
    } else {
        // Update UI to reflect no scripts loaded yet and guide user to settings
        const menu = scriptSelect.querySelector('sp-menu') || document.createElement('sp-menu');
        menu.slot = 'options';
        menu.innerHTML = ''; // Clear existing options
        const defaultOption = document.createElement('sp-menu-item');
        defaultOption.textContent = 'Use Settings (gear icon) to select script folder';
        defaultOption.disabled = true;
        menu.appendChild(defaultOption);
        if (!scriptSelect.contains(menu)) {
             scriptSelect.appendChild(menu);
        }
        scriptSelect.value = ''; // Ensure placeholder is shown or this item
    }
    updateButtonStates();
}

async function selectScriptFolderViaSettings() { // Renamed from selectScriptFolder for clarity
    logStatus('Settings: Opening script folder selection dialog...');
    try {
        const folder = await localFileSystem.getFolder();
        if (folder) {
            selectedScriptFolder = folder; // Update the global reference
            await loadScriptsFromFolder(folder);
            logStatus(`Settings: New script folder selected: ${folder.name}`);
        } else {
            logStatus('Settings: No folder selected or dialog cancelled.');
        }
    } catch (e) {
        if (e.message && e.message.includes("cancelled")) {
            logStatus('Settings: Script folder selection cancelled by user.');
        } else {
            logStatus('Settings: Error selecting script folder: ' + e.message, true);
        }
    }
}

async function loadScriptsFromSelectedFolder() {
    // This function is now primarily for the "Refresh Scripts" button.
    // It reloads from the currently selectedScriptFolder.
    if (selectedScriptFolder) {
        logStatus(`Refreshing scripts from: ${selectedScriptFolder.name}`);
        await loadScriptsFromFolder(selectedScriptFolder);
    } else {
        logStatus('No script folder is currently selected. Use Settings (gear icon) to choose one.', true);
        // Optionally, could trigger selectScriptFolderViaSettings() here too
        // await selectScriptFolderViaSettings(); 
    }
}

async function loadScriptsFromFolder(folder) {
    if (!scriptSelect) {
        console.error("scriptSelect element not found in loadScriptsFromFolder");
        return;
    }
    // Clear existing options by removing all child sp-menu-items from the sp-menu
    const menu = scriptSelect.querySelector('sp-menu');
    if (menu) {
        menu.innerHTML = ''; // Clear existing items
    } else {
        // If sp-menu doesn't exist, create it (should be there from HTML)
        const newMenu = document.createElement('sp-menu');
        newMenu.slot = 'options';
        scriptSelect.appendChild(newMenu);
    }
    
    selectedScriptEntry = null;
    updateButtonStates();

    try {
        const entries = await folder.getEntries();
        const scriptFiles = entries.filter(entry => entry.isFile && (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')));
        
        const currentMenu = scriptSelect.querySelector('sp-menu'); // Get it again

        if (scriptFiles.length === 0) {
            logStatus(`No script files (.js, .jsx) found in ${folder.name}.`);
            const defaultOption = document.createElement('sp-menu-item');
            defaultOption.textContent = 'No scripts found in folder'; // Updated message
            defaultOption.disabled = true;
            currentMenu.appendChild(defaultOption);
            scriptSelect.value = ''; // Reset dropdown value
            return;
        }
        
        // Add a placeholder or default instruction as the first item if desired
        // const placeholderItem = document.createElement('sp-menu-item');
        // placeholderItem.textContent = "Select a script";
        // placeholderItem.value = ""; // Important for placeholder behavior
        // placeholderItem.disabled = true; // Optional: make it unselectable
        // placeholderItem.selected = true; // Optional: make it appear selected
        // currentMenu.appendChild(placeholderItem);

        scriptFiles.forEach(file => {
            const option = document.createElement('sp-menu-item');
            option.textContent = file.name;
            option.value = file.name; 
            // option.dataset.entryName = file.name; // Not strictly needed if value is file.name
            currentMenu.appendChild(option);
        });
        logStatus(`Found ${scriptFiles.length} scripts in ${folder.name}. Populate dropdown.`);
        scriptSelect.value = ''; // Reset to placeholder or first item after populating
    } catch (e) {
        logStatus(`Error reading script folder: ${e.message}`, true);
    }
    updateButtonStates(); // Ensure buttons reflect new script list state
}

async function handleScriptSelection(event) {
    const selectedValue = event.target.value; // sp-dropdown's value property holds the selected item's value

    if (selectedValue && selectedValue !== "" && selectedScriptFolder) { // Ensure it's not a placeholder
        try {
            selectedScriptEntry = await selectedScriptFolder.getEntry(selectedValue);
            if (selectedScriptEntry) {
                logStatus(`Selected script: ${selectedScriptEntry.name}`);
            } else {
                 logStatus(`Could not get entry for script: ${selectedValue}`, true);
                 selectedScriptEntry = null;
            }
        } catch (e) {
            logStatus(`Error getting script entry for "${selectedValue}": ${e.message}`, true);
            selectedScriptEntry = null;
        }
    } else {
        selectedScriptEntry = null; // No script selected or placeholder selected
        logStatus('No script selected or placeholder selected.');
    }
    updateButtonStates();
}

// --- Layer Handling ---
function refreshLayerList() {
    if (!layerListContainer) {
        console.error("layerListContainer not found in refreshLayerList");
        return;
    }
    layerListContainer.innerHTML = ''; // Clear existing layers
    selectedLayers = [];
    // updateButtonStates(); // Called at the end

    if (!app.activeDocument) {
        logStatus('No active document. Open a document to see layers.');
        const placeholder = document.createElement('sp-body');
        placeholder.size = 'S';
        placeholder.classList.add('placeholder-text');
        placeholder.textContent = 'No active document. Open a document or click refresh.';
        layerListContainer.appendChild(placeholder);
        updateButtonStates();
        return;
    }

    try {
        const groupLayers = getGroupLayers(app.activeDocument.layers);
        if (groupLayers.length === 0) {
            const placeholder = document.createElement('sp-body');
            placeholder.size = 'S';
            placeholder.classList.add('placeholder-text');
            placeholder.textContent = 'No group layers found in the active document.';
            layerListContainer.appendChild(placeholder);
            logStatus('No group layers found in the active document.');
        } else {
            groupLayers.forEach(layer => {
                const layerItem = document.createElement('div');
                layerItem.className = 'layer-item';

                const checkbox = document.createElement('sp-checkbox');
                checkbox.textContent = layer.name; // Display name with hierarchy
                checkbox.dataset.layerId = layer.id; // Store original layer ID
                checkbox.addEventListener('change', (e) => handleLayerCheckboxChange(e, layer)); // Pass the layer object

                layerItem.appendChild(checkbox);
                layerListContainer.appendChild(layerItem);
            });
            logStatus(`Found ${groupLayers.length} group layers.`);
        }
    } catch (e) {
        logStatus(`Error refreshing layer list: ${e.message}`, true);
    }
    updateButtonStates();
}

function getGroupLayers(layers, allGroups = [], prefix = '') {
    layers.forEach(layer => {
        if (layer.kind === constants.LayerKind.GROUP) {
            // Store the original layer object along with its display name and ID
            allGroups.push({ 
                id: layer.id, 
                name: `${prefix}${layer.name}`, 
                layerObject: layer // Keep the actual layer object
            });
            if (layer.layers && layer.layers.length > 0) {
                // Pass the layer name as the new prefix for its children
                getGroupLayers(layer.layers, allGroups, `${prefix}${layer.name} > `);
            }
        }
    });
    return allGroups;
}

function handleLayerCheckboxChange(event, layerInfo) { // layerInfo is {id, name, layerObject}
    const layerId = layerInfo.id;
    if (event.target.checked) {
        if (!selectedLayers.find(l => l.id === layerId)) {
            selectedLayers.push(layerInfo); // Store the whole layerInfo object
        }
    } else {
        selectedLayers = selectedLayers.filter(l => l.id !== layerId);
    }
    logStatus(`Selected layers: ${selectedLayers.map(l => l.name).join(', ') || 'None'}`);
    updateButtonStates();
}

// --- Action Execution ---
async function runScriptOnSelectedLayers() {
    if (!selectedScriptEntry || selectedLayers.length === 0) {
        logStatus('Please select a script and at least one layer group.', true);
        return;
    }

    logStatus(`Starting script "${selectedScriptEntry.name}" on ${selectedLayers.length} layer(s).`);
    setLoadingState(true);

    try {
        const scriptModule = await loadScriptModule(selectedScriptEntry);
        if (!scriptModule || typeof scriptModule.run !== 'function') {
            logStatus(`Script "${selectedScriptEntry.name}" must export a 'run' function.`, true);
            setLoadingState(false);
            return;
        }

        await core.executeAsModal(async (executionContext) => {
            const suspensionID = await executionContext.hostControl.suspendHistory({
                documentID: app.activeDocument.id,
                name: `Run ${selectedScriptEntry.name}`
            });

            for (const layerInfo of selectedLayers) {
                // Use the layerObject directly from our selectedLayers array
                const targetLayer = layerInfo.layerObject; 
                // It's good practice to verify the layer still exists, though layerObject should be a live reference.
                // If concerned about staleness, re-fetch by ID:
                // const targetLayer = findLayerById(app.activeDocument.layers, layerInfo.id);

                if (targetLayer && targetLayer.isValid) { // Check if layer is still valid
                    logStatus(`Processing layer: ${layerInfo.name}`);
                    try {
                        await scriptModule.run(targetLayer, app, core, action, constants);
                        logStatus(`Successfully processed ${layerInfo.name}.`);
                    } catch (e) {
                        logStatus(`Error running script on layer ${layerInfo.name}: ${e.message}`, true);
                        console.error(`Script error on ${layerInfo.name}:`, e);
                    }
                } else {
                    logStatus(`Layer ${layerInfo.name} (ID: ${layerInfo.id}) not found or invalid in current document. Skipping.`, true);
                }
            }

            await executionContext.hostControl.resumeHistory(suspensionID);
        }, { commandName: `Running script: ${selectedScriptEntry.name}` });

        logStatus('Script execution finished.');
    } catch (e) {
        logStatus(`Error during script execution: ${e.message}`, true);
        console.error("Overall script execution error:", e);
    }
    setLoadingState(false);
    // refreshLayerList(); // Optionally refresh layers if script might have changed them
    updateButtonStates(); 
}

async function batchProcessFiles() {
    if (!selectedScriptEntry) {
        logStatus('Please select a script first for batch processing.', true);
        return;
    }

    let filesToProcess;
    try {
        filesToProcess = await localFileSystem.getFileForOpening({ 
            allowMultiple: true, 
            types: localFileSystem.createFileTypes({
                "com.adobe.photoshop": [".psd", ".psb", ".psdt"], // More specific types
                "public.image": [".jpg", ".jpeg", ".png", ".tiff", ".gif"] // Example if script supports other images
            })
        });
        if (!filesToProcess || filesToProcess.length === 0) {
            logStatus('No files selected for batch processing.');
            return;
        }
    } catch (e) {
        if (e.message && e.message.includes("cancelled")) {
            logStatus('File selection for batch process cancelled by user.');
        } else {
            logStatus(`Error selecting files for batch: ${e.message}`, true);
        }
        return;
    }
    
    logStatus(`Starting batch process with script "${selectedScriptEntry.name}" on ${filesToProcess.length} file(s).`);
    setLoadingState(true);

    const scriptModule = await loadScriptModule(selectedScriptEntry);
    if (!scriptModule || typeof scriptModule.run !== 'function') {
        logStatus(`Script "${selectedScriptEntry.name}" does not have a 'run' function. Batch process aborted.`, true);
        setLoadingState(false);
        return;
    }

    // Determine target layer names based on current selection in the active document (if any)
    // These names will be used to find layers in each batch-processed file.
    const targetLayerNamesFromSelection = selectedLayers.map(l => l.name.split(' > ').pop()); // Get the base name

    for (let i = 0; i < filesToProcess.length; i++) {
        const fileEntry = filesToProcess[i];
        logStatus(`Batch: Processing file ${i + 1}/${filesToProcess.length}: ${fileEntry.name}`);
        let doc;
        try {
            doc = await app.open(fileEntry);
            if (!doc) {
                logStatus(`Batch: Failed to open ${fileEntry.name}. Skipping.`, true);
                continue;
            }

            await core.executeAsModal(async (executionContext) => {
                const suspensionID = await executionContext.hostControl.suspendHistory({
                    documentID: doc.id,
                    name: `Batch ${selectedScriptEntry.name} on ${doc.name}`
                });

                let layersToProcessInDoc = [];
                const allGroupLayersInDoc = getGroupLayers(doc.layers); // Get all groups {id, name, layerObject}

                if (targetLayerNamesFromSelection.length > 0) {
                    logStatus(`Batch: Looking for layers matching names: ${targetLayerNamesFromSelection.join(', ')} in ${doc.name}`);
                    targetLayerNamesFromSelection.forEach(nameToMatch => {
                        const foundLayers = allGroupLayersInDoc.filter(l => l.name.split(' > ').pop() === nameToMatch);
                        foundLayers.forEach(foundLayer => {
                            if (!layersToProcessInDoc.find(existing => existing.id === foundLayer.id)) {
                                layersToProcessInDoc.push(foundLayer.layerObject); // Add the actual Layer object
                            }
                        });
                    });
                    if (layersToProcessInDoc.length > 0) {
                         logStatus(`Batch: Found ${layersToProcessInDoc.length} matching layers in ${doc.name}.`);
                    } else {
                         logStatus(`Batch: No layers matching predefined names found in ${doc.name}.`);
                    }
                } else {
                    // If no layers were pre-selected in the UI, apply to all group layers in the batch file.
                    logStatus(`Batch: No specific layer names pre-selected. Targeting all ${allGroupLayersInDoc.length} group layers in ${doc.name}.`);
                    layersToProcessInDoc = allGroupLayersInDoc.map(l => l.layerObject);
                }

                if (layersToProcessInDoc.length === 0) {
                    logStatus(`Batch: No target layers to process in ${doc.name}. Skipping script execution for this file.`);
                } else {
                    for (const layer of layersToProcessInDoc) {
                        if (layer && layer.isValid) {
                            logStatus(`Batch: Processing layer: ${layer.name} in ${doc.name}`);
                            try {
                                await scriptModule.run(layer, app, core, action, constants);
                            } catch (e) {
                                logStatus(`Batch: Error running script on layer ${layer.name} in ${doc.name}: ${e.message}`, true);
                                console.error(`Batch script error on ${layer.name} in ${doc.name}:`, e);
                            }
                        } else {
                            logStatus(`Batch: Layer (name: ${layer ? layer.name : 'N/A'}) is invalid or not found in ${doc.name}. Skipping.`, true);
                        }
                    }
                }
                await doc.save(); // Save the document after processing its layers
                await executionContext.hostControl.resumeHistory(suspensionID);
            }, { commandName: `Batch Processing ${doc.name}` });
            
            await doc.close();
            logStatus(`Batch: Finished processing, saved, and closed ${doc.name}`);

        } catch (e) {
            logStatus(`Batch: Error processing file ${fileEntry.name}: ${e.message}`, true);
            console.error(`Batch error on file ${fileEntry.name}:`, e);
            if (doc) { // If document was opened but an error occurred
                try {
                    await doc.closeWithoutSaving(); // Close to avoid leaving files open
                    logStatus(`Batch: Closed ${fileEntry.name} without saving due to error.`);
                } catch (closeErr) { 
                    logStatus(`Batch: Error trying to close ${fileEntry.name} after error: ${closeErr.message}`, true);
                }
            }
        }
    }
    logStatus('Batch processing finished for all selected files.');
    setLoadingState(false);
    updateButtonStates();
}

// --- Utility Functions ---
async function loadScriptModule(scriptFileEntry) {
    if (!scriptFileEntry || !scriptFileEntry.isFile) {
        logStatus('Invalid script file entry provided to loadScriptModule.', true);
        return null;
    }
    try {
        const scriptContent = await scriptFileEntry.read();
        const module = { exports: {} };
        // Provide require shim for 'photoshop' and 'uxp' modules
        const scriptFunction = new Function('module', 'exports', 'require', scriptContent);
        
        const localRequire = (moduleName) => {
            if (moduleName === 'photoshop') return require('photoshop');
            if (moduleName === 'uxp') return require('uxp');
            // Potentially add other UXP modules if scripts are expected to use them
            // For security, do not allow arbitrary path requires here.
            console.warn(`Script tried to require unsupported module: ${moduleName}`);
            throw new Error(`Module '${moduleName}' cannot be required by external scripts.`);
        };
        
        scriptFunction(module, module.exports, localRequire);
        
        logStatus(`Successfully loaded script module: ${scriptFileEntry.name}`);
        return module.exports;
    } catch (e) {
        logStatus(`Error loading script module ${scriptFileEntry.name}: ${e.message}`, true);
        console.error(`Error in loadScriptModule for ${scriptFileEntry.name}:`, e);
        return null;
    }
}

function findLayerById(layers, id) {
    if (!layers || typeof layers.forEach !== 'function') return null;
    for (const layer of layers) {
        if (layer.id === id) return layer;
        if (layer.layers && layer.layers.length > 0) {
            const found = findLayerById(layer.layers, id);
            if (found) return found;
        }
    }
    return null;
}

function updateButtonStates() {
    // Ensure UI elements are initialized before trying to access them
    if (!runScriptBtn || !batchProcessBtn || !refreshLayersBtn || !refreshScriptsBtn || !settingsBtn || !scriptSelect || !loadingIndicator) { // Updated to settingsBtn
        // console.warn("updateButtonStates called before UI fully initialized. Skipping.");
        return; 
    }

    const scriptSelected = selectedScriptEntry !== null && scriptSelect.value !== "";
    const layersSelected = selectedLayers.length > 0;
    const isLoading = !loadingIndicator.classList.contains('hidden');
    const docActive = app.activeDocument !== null;

    runScriptBtn.disabled = !(scriptSelected && layersSelected && docActive) || isLoading;
    batchProcessBtn.disabled = !scriptSelected || isLoading; 
    
    refreshLayersBtn.disabled = isLoading; 
    refreshScriptsBtn.disabled = isLoading || !selectedScriptFolder; // Disable refresh if no folder is set
    settingsBtn.disabled = isLoading; // Settings button should generally be enabled unless loading
    scriptSelect.disabled = isLoading || !selectedScriptFolder; // Disable dropdown if no folder
}

function setLoadingState(isLoading) {
    if (!loadingIndicator) return; // Guard clause

    if (isLoading) {
        loadingIndicator.classList.remove('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
    updateButtonStates(); // Update buttons based on loading state
}

// Create a dummy scripts folder and a sample script for testing - Call manually if needed
async function createDummyScripts() {
    try {
        const pluginFolder = await localFileSystem.getPluginFolder();
        let scriptsDir = null;
        try {
             scriptsDir = await pluginFolder.getEntry('scripts');
        } catch (e) {
            // Folder doesn't exist, create it
            scriptsDir = await pluginFolder.createFolder('scripts');
            logStatus('Created dummy scripts folder.');
        }

        const sampleScriptContent = `
// Sample script: Toggle visibility of the layer
module.exports.run = async (layer, app, core, action, constants) => {
    if (!layer) {
        console.error('Sample Script: No layer provided.');
        return;
    }
    console.log(\`Sample Script: Toggling visibility for layer: \${layer.name}\`);
    await core.executeAsModal(async () => {
        layer.visible = !layer.visible;
    }, { commandName: 'Toggle Layer Visibility' });
    console.log(\`Sample Script: Visibility for \${layer.name} is now \${layer.visible}\`);
};
`;
        const sampleScriptFile = await scriptsDir.createFile('sampleScript.js', { overwrite: true });
        await sampleScriptFile.write(sampleScriptContent);
        logStatus('Created sampleScript.js in scripts folder.');

    } catch (e) {
        logStatus(`Error creating dummy scripts: ${e.message}`, true);
    }
}

// Call this once for development/testing if you don't have scripts folder setup
// createDummyScripts(); // Then reload plugin and call loadDefaultScripts or select folder

// Initial log to confirm this script file itself is loaded by the panel.
console.log('index.js: Script file loaded by panel.');
