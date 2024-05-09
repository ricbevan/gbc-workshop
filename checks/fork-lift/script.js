getStarted();

let id_ForkLiftChecksBoard = '4105630839';
let id_ForkLiftChecksBoardDate = 'date';
let id_ForkLiftChecksBoardForkLift = 'connect_boards';
let id_ForkLiftChecksBoardDefect = 'text';
let id_ForkLiftChecksBoardLoggedBy = 'people';

var forkLiftCheckId = '';

document.addEventListener("DOMContentLoaded", function() {
	getDates();
	
	gbc('#check-fork-lift').on('change', function(e) {
		selectForkLift();
	});
});

function getDates() {
	var html = '<option value=\"\" disabled hidden selected>date</option>';
	
	const startDate = new Date("01/01/2024");
	const endDate = new Date(); // today
	
	let loopDate = new Date(endDate);
	
	while (loopDate >= startDate) {
	  html += "<option value=\"" + loopDate.toISOString().slice(0, 10) + "\">" + loopDate.toLocaleDateString("en-GB") + "</option>";
	  
	  loopDate.setDate(loopDate.getDate() - 1);
	}
	
	gbc('#check-date').html(html).on('change', function(e) {
		getForkLiftChecks();
	});
	
	gbc('#check-date').val(endDate.toISOString().slice(0, 10));
	
	getForkLiftChecks();
}

function getForkLiftChecks() {
	let lastSelectedForkLiftId = getLocalStorage('last-selected-fork-lift');
	
	let checkDate = gbc('#check-date').val();
	
	let query = ' { items_page_by_column_values (limit: 25, board_id: ' + id_ForkLiftChecksBoard + ', columns: [{column_id: "' + id_ForkLiftChecksBoardDate + '", column_values: ["' + checkDate + '"]}]) { items { id name column_values { id value text type column { title } ... on BoardRelationValue { display_value linked_item_ids } } } } } ';
	
	mondayAPI(query, function(data) {
		let forkLiftChecks = new ForkLiftChecks(data);
		
		if (forkLiftChecks.all.length == 0) {
			UIkit.notification('No checks available for this day, please speak to the office', 'danger');
			return false;
		}
		
		var html = '';
		var htmlDropDown = '<option disabled hidden selected>fork lift</option>';
		
		for (var i = 0; i < forkLiftChecks.all.length; i++) {
			let forkLiftCheck = forkLiftChecks.all[i];
			
			htmlDropDown += "<option value=\"" + forkLiftCheck.forkLiftId + "\" data-id=\"" + forkLiftCheck.id + "\">" + forkLiftCheck.name + "</option>";
			
			if (forkLiftCheck.forkLiftId == lastSelectedForkLiftId) {
				forkLiftCheckId = forkLiftCheck.id; // used to save the fork lift check later
				
				html += '<div class="uk-width-1-1"> <input class="uk-input" id="fork-lift-defect" type="text" placeholder="defect" value="' + forkLiftCheck.defect + '"> </div>';
				html += '<div class="uk-width-1-1"> <label class="uk-text-bold"><input class="uk-checkbox" type="checkbox" id="select-all-fork-lift-checks"> Select all/none</label> </div>';
				
				html += '<div id="fork-lift-check-tickbox-container" class="uk-child-width-1-3@m uk-grid-small" uk-grid>';
				
				for (var j = 0; j < forkLiftCheck.checks.length; j++) {
					let forkLiftCheckBox = forkLiftCheck.checks[j];
					
					let checked = ((forkLiftCheckBox.checked) ? ' checked' : '');
					
					html += '<div>';
					html += '<label><input class="uk-checkbox" type="checkbox" id="' + forkLiftCheckBox.id + '"' + checked + '> ' + forkLiftCheckBox.title + '</label> ';
					html += '</div>';
				}
				
				html += '</div>';
				
				html += '<div> <button id="save-fork-lift-checks" class="uk-button uk-button-primary">Save</button> </div>';
			}
		}
		
		gbc('#check-fork-lift').show().html(htmlDropDown);
		gbc('#page').show().html(html);
		
		gbc('#save-fork-lift-checks').on('click', function(e) {
			saveForkLiftChecks();
		});
		
		gbc('#select-all-fork-lift-checks').on('click', function(e) {
			selectAll();
		});
		
		if (getLocalStorage('last-selected-fork-lift') != null) {
			gbc('#check-fork-lift').val(getLocalStorage('last-selected-fork-lift'));
		}
	});
}

function selectForkLift() {
	let checkForkLift = gbc('#check-fork-lift').val();
	localStorage.setItem("last-selected-fork-lift", checkForkLift);
	getForkLiftChecks();
}

function selectAll() {
	let checkboxes = document.querySelectorAll('input[type=checkbox]');
	let selectAllCheckbox = document.querySelectorAll('#select-all-fork-lift-checks')[0].checked;
	
	for (var i = 0; i < checkboxes.length; i++) {
		checkboxes[i].checked = selectAllCheckbox;
	}
}

function saveForkLiftChecks() {
	if (forkLiftCheckId == '') {
		UIkit.notification('Fork Lift is not selected', 'danger');
		return false;
	}
	
	let checkboxes = document.querySelectorAll('input[type=checkbox]:not(#select-all-fork-lift-checks)');
	let defect = document.querySelectorAll('#fork-lift-defect')[0].value;
	
	var updateJson = '"' + id_ForkLiftChecksBoardLoggedBy + '": {"personsAndTeams": [{"id": ' + userId + ', "kind": "person"}] }, ';
	updateJson += '"' + id_ForkLiftChecksBoardDefect + '": \"' + defect + '\", ';
	
	for (var i = 0; i < checkboxes.length; i++) {
		if (checkboxes[i].checked) {
			updateJson += '"' + checkboxes[i].id +'": {"checked" : "true"}, ';
		} else {
			updateJson += '"' + checkboxes[i].id +'": null, ';
		}
	}
	
	updateJson = JSON.stringify('{' + updateJson.slice(0, -2) + '}');
	var query = ' mutation { change_multiple_column_values(item_id: ' + forkLiftCheckId + ', board_id:' + id_ForkLiftChecksBoard + ', column_values: ' + updateJson + ') { id, name } } ';
	
	mondayAPI(query, function(data) {
		getForkLiftChecks();
	});
}

class ForkLiftCheck {
	constructor(forkLiftCheck) {
		this.id = forkLiftCheck.id;
		this.name = forkLiftCheck.name;
		this.defect = columnText(forkLiftCheck, id_ForkLiftChecksBoardDefect);
		let forkLiftId = linkedColumnValue(forkLiftCheck, id_ForkLiftChecksBoardForkLift);
		this.forkLiftId = ((forkLiftId.length > 0) ? forkLiftId[0] : null);
		
		var checks = [];
		
		for (var i = 0; i < forkLiftCheck.column_values.length; i++) {
			let checkColumn = forkLiftCheck.column_values[i];
			
			if (checkColumn.type == 'checkbox') {
				var checked = (checkColumn.text == 'v');
				let check = { id: checkColumn.id, title: checkColumn.column.title, description: checkColumn.column.description, checked: checked };
				checks.push(check);
			}
		}
		
		this.checks = checks;
	}
}

class ForkLiftChecks {
	#forkLiftChecks = [];
	
	constructor(data) {
		let forkLiftChecks = data['data']['items_page_by_column_values']['items'];
		
		for (var i = 0; i < forkLiftChecks.length; i++) {
			let forkLiftCheck = forkLiftChecks[i];
			let newForkLiftCheck = new ForkLiftCheck(forkLiftCheck);
			this.#forkLiftChecks.push(newForkLiftCheck);
		}
	}
	
	get all() {
		this.#forkLiftChecks.sort((a, b) => (a.name > b.name) ? 1 : -1);
		return this.#forkLiftChecks;
	}
}