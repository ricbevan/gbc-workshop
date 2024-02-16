var debuggingOn = false;
var userId;
var userName;
var key;
var loadingCount = 0;

function getLocalStorage(key) {
	if (key == undefined) {
		throw 'No key provided (getLocalStorage)';
	}
	
	return localStorage.getItem(key);
}

function setLocalStorage(key, val) {
	if (key == undefined) {
		throw 'No key provided (setLocalStorage)';
	}
	
	if (val == undefined) {
		throw 'No val provided (setLocalStorage)';
	}
	
	localStorage.setItem(key, val);
}

function loadLocalVariables() {
	userId = getLocalStorage('User ID');
	key = getLocalStorage('Key');
}

function displayError(errorMessage) {
	gbc('#loading').hide();
	gbc('#error').show();
	gbc('#error p').html('<b>Please speak to the office</b><br />' + errorMessage);
	gbc('#page').hide();
}

function hideLoading() {
	loadingCount -= 1;
	
	if (loadingCount == 0) {
		gbc('#loading').hide();
	}
}

function showLoading() {
	loadingCount += 1;
	
	gbc('#loading').show();
}

function getStarted() {
	try {
		loadLocalVariables();
		
		// if user requests page not index and isn't logged in, redirect them to the index page
		if ((userId == '') || (userId == null) || (userId == undefined)) {
			let page = window.location.pathname.replace('index.html', '');
			
			if (page != '/') {
				window.location.replace('/');
			}
			
			displayError('Not connected [' + userId + ']');
		}
		
		logOn();
	} catch (e) {
		displayError(e);
	}
}

function validJson(str) {
	if ((str == null) || (str == '{}') || (str == undefined)) {
		return false
	}
	
	try {
		JSON.parse(str);
	} catch (e) {
		return false;
	}
	
	return true;
}

function camelCase(str) {
	return str.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
}

// ==================================================
// =============== GET COLUMN VALUES ================
// ==================================================

function columnText(arr, column) {
	let columnValue = getColumn(arr['column_values'], column);
	
	if (columnValue == null) { return ''; }
	
	return columnValue['text'];
}

function columnValue(arr, column) {
	let columnValue = getColumn(arr['column_values'], column);
	
	if (columnValue == null) { return ''; }
	
	return columnValue['value'];
}

function linkedColumnValue(arr, column) {
	let columnValue = getColumn(arr['column_values'], column);
	
	if (columnValue == null) { return []; }
	
	return columnValue['linked_item_ids'];
}

function linkedColumnText(arr, column) {
	let columnValue = getColumn(arr['column_values'], column);
	
	if (columnValue == null) { return ''; }
	
	return columnValue['display_value'];
}

function getColumn(arr, column) {
	if (arr == undefined) { return null; }
	if (column == undefined) { return null; }
	
	return arr.find(x => x['id'] === column);
}