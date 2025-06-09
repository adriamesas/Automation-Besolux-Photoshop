/**
 * Test Script: Toggles the visibility of the provided layer and logs its name.
 *
 * @param {Layer} layer - The Photoshop Layer object to act upon.
 * @param {object} app - The Photoshop application object.
 * @param {object} core - The Photoshop core object for modal execution.
 * @param {object} action - The Photoshop action object for batchPlay.
 * @param {object} constants - The Photoshop constants object.
 */
module.exports.run = async (layer, app, core, action, constants) => {
    if (!layer) {
        console.error('TestScript: No layer provided.');
        // Optionally, use core.showAlert for user-visible errors
        // await core.showAlert({ message: 'TestScript: No layer was provided to the script.' });
        return;
    }

    try {
        console.log(`TestScript: Running on layer "${layer.name}" (ID: ${layer.id})`);
        
        await core.executeAsModal(async (executionContext) => {
            // Suspend history for a single undo step
            const historyStateID = await executionContext.hostControl.suspendHistory({
                documentID: app.activeDocument.id,
                name: `Toggle Visibility: ${layer.name}`
            });

            layer.visible = !layer.visible;
            console.log(`TestScript: Layer "${layer.name}" visibility set to ${layer.visible}`);

            // Resume history
            await executionContext.hostControl.resumeHistory(historyStateID);

        }, { commandName: `Test Script on ${layer.name}` });

        // Optional: Notify user of success
        // await core.showAlert({ message: `TestScript: Toggled visibility for layer "${layer.name}".` });

    } catch (e) {
        console.error(`TestScript: Error processing layer "${layer.name}": ${e.message}`);
        // Optionally, show an alert for errors
        // await core.showAlert({ message: `TestScript: Error on layer "${layer.name}": ${e.message}` });
    }
};
