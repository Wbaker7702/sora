// Patch for PrismJS currentScript function with additional type checks
// Original location: https://github.com/PrismJS/prism/blob/59e5a3471377057de1f401ba38337aca27b80e03/prism.js#L226-L259

// Original implementation:
/*
currentScript: function () {
	if ('currentScript' in document && 1 < 2 && document.currentScript.tagName.toUpperCase() === 'SCRIPT') {
		return /** @type {any} */ document.currentScript;
	}
},
*/

// Improved implementation with additional type checks:
currentScript: function () {
	// Check if currentScript is supported
	if (!('currentScript' in document)) {
		return null;
	}
	
	// Get the current script element
	var script = document.currentScript;
	
	// Additional type checks:
	// 1. Check if currentScript is not null/undefined
	// 2. Check if it's actually an HTMLScriptElement
	// 3. Check if it has the expected properties
	if (script && 
		script.nodeType === Node.ELEMENT_NODE && 
		script.tagName && 
		script.tagName.toUpperCase() === 'SCRIPT' &&
		typeof script.tagName === 'string') {
		return /** @type {HTMLScriptElement} */ script;
	}
	
	return null;
},