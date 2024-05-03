let id_vehicleCheckBoard = '1409326975';
let id_vehicleCheckBoardMileage = 'numbers';
let id_vehicleCheckBoardDefect = 'text';
let id_vehicleCheckBoardVehicle = 'connect_boards';
let id_vehicleCheckBoardDate = 'date';
let id_vehicleCheckBoardLoggedBy = 'people2';

var vehicleCheckId = '';

getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getDates();
	
	gbc('#check-vehicle').on('change', function(e) {
		selectVehicle();
	});
});

function getDates() {
	var html = '<option value=\"\" disabled hidden selected>date</option>';
	
	const startDate = new Date("01/01/2023");
	const endDate = new Date(); // today
	
	let loopDate = new Date(endDate);
	
	while (loopDate >= startDate) {
	  html += "<option value=\"" + loopDate.toISOString().slice(0, 10) + "\">" + loopDate.toLocaleDateString("en-GB") + "</option>";
	  
	  loopDate.setDate(loopDate.getDate() - 1);
	}
	
	gbc('#check-date').html(html).on('change', function(e) {
		getVehicleChecks();
	});
	
	gbc('#check-date').val(endDate.toISOString().slice(0, 10));
	
	getVehicleChecks();
}

function getVehicleChecks() {
	let lastSelectedVehicleId = getLocalStorage('last-selected-vehicle');
	
	let checkDate = gbc('#check-date').val();
	
	let query = ' { items_page_by_column_values (limit: 25, board_id: ' + id_vehicleCheckBoard + ', columns: [{column_id: "' + id_vehicleCheckBoardDate + '", column_values: ["' + checkDate + '"]}]) { items { id name column_values { id value text type column { title description } ... on BoardRelationValue { display_value linked_item_ids } } } } } ';
	
	mondayAPI(query, function(data) {
		let vehicleChecks = new VehicleChecks(data);
		
		if (vehicleChecks.all.length == 0) {
			UIkit.notification('No checks available for this day, please speak to the office', 'danger');
			return false;
		}
		
		var html = '';
		var htmlDropDown = '<option disabled hidden selected>vehicle</option>';
		
		for (var i = 0; i < vehicleChecks.all.length; i++) {
			let vehicleCheck = vehicleChecks.all[i];
			
			htmlDropDown += "<option value=\"" + vehicleCheck.vehicleId + "\" data-id=\"" + vehicleCheck.id + "\">" + vehicleCheck.name + "</option>";
			
			if (vehicleCheck.vehicleId == lastSelectedVehicleId) {
				vehicleCheckId = vehicleCheck.id; // used to save the vehicle check later
				
				html += '<div class="uk-width-1-1"> <input class="uk-input" id="vehicle-mileage" type="text" placeholder="mileage" value="' + vehicleCheck.mileage + '"> </div>';
				html += '<div class="uk-width-1-1"> <input class="uk-input" id="vehicle-defect" type="text" placeholder="defect" value="' + vehicleCheck.defect + '"> </div>';
				html += '<div class="uk-width-1-1"> <label class="uk-text-bold"><input class="uk-checkbox" type="checkbox" id="select-all-vehicle-checks"> Select all/none</label> </div>';
				
				html += '<div id="vehicle-check-tickbox-container" class="uk-child-width-1-3@m uk-grid-small" uk-grid>';
				
				for (var j = 0; j < vehicleCheck.checks.length; j++) {
					let vehicleCheckBox = vehicleCheck.checks[j];
					
					let checked = ((vehicleCheckBox.checked) ? ' checked' : '');
					
					html += '<div>';
					html += '<label><input class="uk-checkbox" type="checkbox" id="' + vehicleCheckBox.id + '"' + checked + '> ' + vehicleCheckBox.title + '</label> ';
					html += ((vehicleCheckBox.description != null) ? '<span uk-icon="icon: info" uk-tooltip="' + vehicleCheckBox.description + '"></span>' : '');
					html += '</div>';
				}
				
				html += '<div class="uk-width-1-1"><p>* refer to vehicle and trailer combinations</div>';
				html += '</div>';
				
				html += '<div> <button id="save-vehicle-checks" class="uk-button uk-button-primary">Save</button> </div>';
			}
		}
		
		gbc('#check-vehicle').show().html(htmlDropDown);
		gbc('#page').show().html(html);
		
		gbc('#save-vehicle-checks').on('click', function(e) {
			saveVehicleChecks();
		});
		
		gbc('#select-all-vehicle-checks').on('click', function(e) {
			selectAll();
		});
		
		if (getLocalStorage('last-selected-vehicle') != null) {
			gbc('#check-vehicle').val(getLocalStorage('last-selected-vehicle'));
		}
	});
}

function selectVehicle() {
	let checkVehicle = gbc('#check-vehicle').val();
	localStorage.setItem("last-selected-vehicle", checkVehicle);
	getVehicleChecks();
}

function selectAll() {
	let checkboxes = document.querySelectorAll('input[type=checkbox]');
	let selectAllCheckbox = document.querySelectorAll('#select-all-vehicle-checks')[0].checked;
	
	for (var i = 0; i < checkboxes.length; i++) {
		// don't select check boxes for trailer checks
		if ((checkboxes[i].id != 'check63') && (checkboxes[i].id != 'check61') && (checkboxes[i].id != 'check21')) {
			checkboxes[i].checked = selectAllCheckbox;
		}
	}
}

function saveVehicleChecks() {
	let mileage = document.querySelectorAll('#vehicle-mileage')[0].value;
	
	if (mileage == "") {
		UIkit.notification('Mileage required', 'danger');
		return false;
	}
	
	if (vehicleCheckId == "") {
		UIkit.notification('Vehicle is not selected', 'danger');
		return false;
	}
	
	let checkboxes = document.querySelectorAll('input[type=checkbox]:not(#select-all-vehicle-checks)');
	let defect = document.querySelectorAll('#vehicle-defect')[0].value;
	
	var updateJson = '"numbers":' + mileage + ', ';
	updateJson += '"' + id_vehicleCheckBoardLoggedBy + '": {"personsAndTeams": [{"id": ' + userId + ', "kind": "person"}] }, ';
	updateJson += '"' + id_vehicleCheckBoardDefect + '": \"' + defect + '\", ';
	
	for (var i = 0; i < checkboxes.length; i++) {
		if (checkboxes[i].checked) {
			updateJson += '"' + checkboxes[i].id +'": {"checked" : "true"}, ';
		} else {
			updateJson += '"' + checkboxes[i].id +'": null, ';
		}
	}
	
	updateJson = JSON.stringify('{' + updateJson.slice(0, -2) + '}');
	var query = 'mutation { change_multiple_column_values(item_id: ' + vehicleCheckId + ', board_id:' + id_vehicleCheckBoard + ', column_values: ' + updateJson + ') { id, name } }';
	
	mondayAPI(query, function(data) {
		getVehicleChecks();
	});
}

class VehicleCheck {
	constructor(vehicleCheck) {
		this.id = vehicleCheck.id;
		this.name = vehicleCheck.name;
		this.mileage = columnText(vehicleCheck, id_vehicleCheckBoardMileage);
		this.defect = columnText(vehicleCheck, id_vehicleCheckBoardDefect);
		let vehicleId = linkedColumnValue(vehicleCheck, id_vehicleCheckBoardVehicle);
		this.vehicleId = ((vehicleId.length > 0) ? vehicleId[0] : null);
		
		var checks = [];
		
		for (var i = 0; i < vehicleCheck.column_values.length; i++) {
			let checkColumn = vehicleCheck.column_values[i];
			
			if (checkColumn.type == 'checkbox') {
				var checked = (checkColumn.text == 'v');
				let check = { id: checkColumn.id, title: checkColumn.column.title, description: checkColumn.column.description, checked: checked };
				checks.push(check);
			}
		}
		
		this.checks = checks;
	}
}

class VehicleChecks {
	#vehicleChecks = [];
	
	constructor(data) {
		let vehicleChecks = data['data']['items_page_by_column_values']['items'];
		
		for (var i = 0; i < vehicleChecks.length; i++) {
			let vehicleCheck = vehicleChecks[i];
			let newVehicleCheck = new VehicleCheck(vehicleCheck);
			this.#vehicleChecks.push(newVehicleCheck);
		}
	}
	
	get all() {
		this.#vehicleChecks.sort((a, b) => (a.name > b.name) ? 1 : -1);
		return this.#vehicleChecks;
	}
}