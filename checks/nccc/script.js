getStarted();

let id_NcccChecksBoard = '4073327836';
let id_NcccChecksBoardDate = 'date';
let id_NcccChecksBoardTank1Temperature = 'numbers';
let id_NcccChecksBoardTank1Solution = 'numbers9';
let id_NcccChecksBoardTank2Contamination = 'numbers1';
let id_NcccChecksBoardTank3Contamination = 'numbers8';
let id_NcccChecksBoardTank4Temperature = 'numbers2';
let id_NcccChecksBoardTank4Solution = 'numbers5';
let id_NcccChecksBoardMetAdded = 'numbers21';
let id_NcccChecksBoardPhosAdded = 'numbers89';
let id_NcccChecksBoardLoggedBy = 'people';

var ncccCheckId = '';

document.addEventListener("DOMContentLoaded", function() {
	getDates();
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
		getNcccChecks();
	});
	
	gbc('#check-date').val(endDate.toISOString().slice(0, 10));
	
	getNcccChecks();
}

function getNcccChecks() {
	let checkDate = gbc('#check-date').val();
	
	let query = ' { items_page_by_column_values (limit: 1, board_id: ' + id_NcccChecksBoard + ', columns: [{column_id: "' + id_NcccChecksBoardDate + '", column_values: ["' + checkDate + '"]}]) { items { id name column_values { id value text } } } } ';
	
	mondayAPI(query, function(data) {
		let ncccChecks = new NcccChecks(data);
		
		if (ncccChecks.all.length == 0) {
			UIkit.notification('No checks available for this day, please speak to the office', 'danger');
			return false;
		}
		
		let ncccCheck = ncccChecks.all[0];
		
		ncccCheckId = ncccCheck.id;
		
		var html = '';
		
		html += '<div>';
		html += '<label class="uk-form-label" for="tank-1-temperature"><span class="uk-text-bold">Tank 1</span> temperature</label>';
		html += '<div class="uk-form-controls"> <input class="uk-input" id="tank-1-temperature" type="number" placeholder="0" step="1" value="' + ncccCheck.tank1Temperature + '"> </div>';
		html += '</div>';
		
		html += '<div>';
		html += '<label class="uk-form-label" for="tank-1-solution"><span class="uk-text-bold">Tank 1</span> solution</label>';
		html += '<div class="uk-form-controls"> <input class="uk-input" id="tank-1-solution" type="number" placeholder="0.0" step="0.1" value="' + ncccCheck.tank1Solution + '"> </div>';
		html += '</div>';
		
		html += '<div>';
		html += '<label class="uk-form-label" for="tank-2-contamination"><span class="uk-text-bold">Tank 2</span> contamination</label>';
		html += '<div class="uk-form-controls"> <input class="uk-input" id="tank-2-contamination" type="number" placeholder="0.0" step="0.1" value="' + ncccCheck.tank2Contamination + '"> </div>';
		html += '</div>';
		
		html += '<div>';
		html += '<label class="uk-form-label" for="tank-3-contamination"><span class="uk-text-bold">Tank 3</span> contamination</label>';
		html += '<div class="uk-form-controls"> <input class="uk-input" id="tank-3-contamination" type="number" placeholder="0.0" step="0.1" value="' + ncccCheck.tank3Contamination + '"> </div>';
		html += '</div>';
		
		html += '<div>';
		html += '<label class="uk-form-label" for="tank-4-temperature"><span class="uk-text-bold">Tank 4</span> temperature</label>';
		html += '<div class="uk-form-controls"> <input class="uk-input" id="tank-4-temperature" type="number" placeholder="0" step="1" value="' + ncccCheck.tank4Temperature + '"> </div>';
		html += '</div>';
		
		html += '<div>';
		html += '<label class="uk-form-label" for="tank-4-solution"><span class="uk-text-bold">Tank 4</span> solution</label>';
		html += '<div class="uk-form-controls"> <input class="uk-input" id="tank-4-solution" type="number" placeholder="0.0" step="0.1" value="' + ncccCheck.tank4Solution + '"> </div>';
		html += '</div>';
		
		html += '<div>';
		html += '<label class="uk-form-label" for="met-added"><span class="uk-text-bold">Met</span> added</label>';
		html += '<div class="uk-form-controls"> <input class="uk-input" id="met-added" type="number" placeholder="0" step="1" value="' + ncccCheck.metAdded + '"> </div>';
		html += '</div>';
		
		html += '<div>';
		html += '<label class="uk-form-label" for="phos-added"><span class="uk-text-bold">Phos</span> added</label>';
		html += '<div class="uk-form-controls"> <input class="uk-input" id="phos-added" type="number" placeholder="0" step="1" value="' + ncccCheck.phoAdded + '"> </div>';
		html += '</div>';
		
		html += '<div> <button id="save-nccc-checks" class="uk-button uk-button-primary">Save</button> </div>';
		
		gbc('#page').show().html(html);
		
		gbc('#save-nccc-checks').on('click', function(e) {
			saveNccchecks();
		});
	});
}

function saveNccchecks() {
	let tank1Temperature = gbc('#tank-1-temperature').val();
	let tank1Solution = gbc('#tank-1-solution').val();
	let tank2Contamination = gbc('#tank-2-contamination').val();
	let tank3Contamination = gbc('#tank-3-contamination').val();
	let tank4Temperature = gbc('#tank-4-temperature').val();
	let tank4Solution = gbc('#tank-4-solution').val();
	let metAdded = gbc('#met-added').val();
	let phosAdded = gbc('#phos-added').val();
	
	if (tank1Temperature == "") {
		UIkit.notification('Enter the tank 1 temperature', 'danger');
		return false;
	}
	
	if (tank1Solution == "") {
		UIkit.notification('Enter the tank 1 solution', 'danger');
		return false;
	}
	
	if (tank2Contamination == "") {
		UIkit.notification('Enter the tank 2 contamination', 'danger');
		return false;
	}
	
	if (tank3Contamination == "") {
		UIkit.notification('Enter the tank 3 contamination', 'danger');
		return false;
	}
	
	if (tank4Temperature == "") {
		UIkit.notification('Enter the tank 4 temperature', 'danger');
		return false;
	}
	
	if (tank4Solution == "") {
		UIkit.notification('Enter the tank 4 solution', 'danger');
		return false;
	}
	
	var updateJson = '"' + id_NcccChecksBoardLoggedBy + '": {"personsAndTeams": [{"id": ' + userId + ', "kind": "person"}] }, ';
	updateJson += '"' + id_NcccChecksBoardTank1Temperature + '": \"' + tank1Temperature + '\", ';
	updateJson += '"' + id_NcccChecksBoardTank1Solution + '": \"' + tank1Solution + '\", ';
	updateJson += '"' + id_NcccChecksBoardTank2Contamination + '": \"' + tank2Contamination + '\", ';
	updateJson += '"' + id_NcccChecksBoardTank3Contamination + '": \"' + tank3Contamination + '\", ';
	updateJson += '"' + id_NcccChecksBoardTank4Temperature + '": \"' + tank4Temperature + '\", ';
	updateJson += '"' + id_NcccChecksBoardTank4Solution + '": \"' + tank4Solution + '\", ';
	updateJson += '"' + id_NcccChecksBoardMetAdded + '": \"' + metAdded + '\", ';
	updateJson += '"' + id_NcccChecksBoardPhosAdded + '": \"' + phosAdded + '\"';
	
	updateJson = JSON.stringify('{' + updateJson + '}');
	var query = ' mutation { change_multiple_column_values(item_id: ' + ncccCheckId + ', board_id:' + id_NcccChecksBoard + ', column_values: ' + updateJson + ') { id, name } } ';
	
	mondayAPI(query, function(data) {
		getNcccChecks();
	});
}

class NcccCheck {
	constructor(ncccCheck) {
		this.id = ncccCheck.id;
		this.name = ncccCheck.name;
		this.tank1Temperature = columnText(ncccCheck, id_NcccChecksBoardTank1Temperature);
		this.tank1Solution = columnText(ncccCheck, id_NcccChecksBoardTank1Solution);
		this.tank2Contamination = columnText(ncccCheck, id_NcccChecksBoardTank2Contamination);
		this.tank3Contamination = columnText(ncccCheck, id_NcccChecksBoardTank3Contamination);
		this.tank4Temperature = columnText(ncccCheck, id_NcccChecksBoardTank4Temperature);
		this.tank4Solution = columnText(ncccCheck, id_NcccChecksBoardTank4Solution);
		this.metAdded = columnText(ncccCheck, id_NcccChecksBoardMetAdded);
		this.phoAdded = columnText(ncccCheck, id_NcccChecksBoardPhosAdded);
	}
}

class NcccChecks {
	#ncccChecks = [];
	
	constructor(data) {
		let ncccChecks = data['data']['items_page_by_column_values']['items'];
		
		for (var i = 0; i < ncccChecks.length; i++) {
			let ncccCheck = ncccChecks[i];
			let newNcccCheck = new NcccCheck(ncccCheck);
			this.#ncccChecks.push(newNcccCheck);
		}
	}
	
	get all() {
		return this.#ncccChecks;
	}
}