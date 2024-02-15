getStarted();

document.addEventListener("DOMContentLoaded", function() {
	gbc('#goods-in-date').on('change', function(e) {
		getPurchaseOrderRadiators();
	});
	
	getPurchaseOrders();
});

function getPurchaseOrders() {
	let query = ' { boards(ids:' + id_radiatorBoard + ') { groups { id title } } } ';
	
	mondayAPI(query, function(data) {
		let purchaseOrders = new PurchaseOrders(data);
		
		if (purchaseOrders.all.length == 0) {
			displayError('No purchase orders (getPurchaseOrders)');
			return false;
		}
		
		var html = '';
		
		for (var i = 0; i < purchaseOrders.all.length; i++) {
			let purchaseOrder = purchaseOrders.all[i];
			
			html += '<option value="' + purchaseOrder.id + '">' + purchaseOrder.friendlyDate + '</option>';
		}
		
		gbc('#goods-in-date').html(html);
		
		getPurchaseOrderRadiators();
	});
}

function getPurchaseOrderRadiators() {
	let purchaseOrderId = gbc('#goods-in-date').val();
	
	let query = ' { boards(ids:[' + id_radiatorBoard + ']) { groups(ids:["' + purchaseOrderId + '"]) { items_page(limit:500) { items { ' + fields_radiators + ' } } } } } ';
	
	mondayAPI(query, function(data) {
		let palletsOfRadiators = new PalletsOfRadiators(data);
		
		var html = '';
		
		for (var i = 0; i < palletsOfRadiators.all.length; i++) {
			let palletOfRadiators = palletsOfRadiators.all[i];
			
			html += '<div>';
			html += '<h3> <label> <input class="uk-checkbox" type="checkbox" id="pallet' + palletOfRadiators.palletNumber + '"> ' + palletOfRadiators.palletNumber + '</label> </h3>';
			html += '<ul class="uk-list uk-list-striped">';
			
			for (var j = 0; j < palletOfRadiators.radiators.length; j++) {
				let radiator = palletOfRadiators.radiators[j];
				
				let checked = (radiator.received ? ' checked' : '');
				let disabled = (((radiator.outPallet == '') || (radiator.outPallet == undefined)) ? '' : ' disabled uk-tooltip="Radiator on pallet ' + radiator.outPallet  + '"');
				
				html += '<li class="uk-flex uk-flex-middle"> <label class="uk-flex-1">';
				html += '<input class="uk-checkbox" type="checkbox" id="' + radiator.id + '" data-changed="false"' + checked + disabled + '> [' + radiator.colour + '] ' + radiator.name;
				html += '</label> <span uk-icon="' + radiator.icon + '" uk-tooltip="' + radiator.status + '" id="' + radiator.id + '" class="radiator-info ' + radiator.style + '"></span> </li>';
			}
			
			html += '</ul>';
			html += '</div>';
		}
		
		html += '<div><button class="uk-button uk-button-primary uk-width-1-1" id="goods-in-save">Save</button></div>';
		
		gbc('#page').html(html).show();
		
		gbc('.radiator-info').on('click', function(e) {
			let radiatorId = e.target.closest('span').id;
			getRadiatorComments(radiatorId, getPurchaseOrderRadiators);
		});
		
		gbc('#goods-in-save').on('click', function(e) {
			saveRadiators();
		});
		
		gbc('#page h3 input').on('change', function(e) {
			selectAllOnPallet(this);
		});
		
		gbc('#page ul input[type="checkbox"]').on('click', function(e) {
			e.target.dataset.changed = "true";
		});
	});
}

function selectAllOnPallet(pallet) {
	let palletCheckboxes = pallet.parentElement.parentElement.parentElement.querySelectorAll('ul input[type=checkbox]');
	let selectAllCheckbox = document.querySelectorAll('#' + pallet.id)[0].checked;
	
	for (var i = 0; i < palletCheckboxes.length; i++) {
		let palletCheckbox = palletCheckboxes[i];
		
		if (!palletCheckbox.disabled) {
			palletCheckbox.checked = selectAllCheckbox;
			palletCheckbox.dataset.changed = "true";
		}
	}
}

function saveRadiators() {
	
	var query = ' mutation { ';
	
	gbc('#page ul input[type=checkbox][data-changed="true"]').each(function(radiator) {
		let radiatorId = radiator.id;
		let radiatorChecked = radiator.checked;
		
		let radiatorColumnJson = JSON.stringify(' { "' + id_radiatorBoardOutReceived + '" : ' + (radiatorChecked ? '{ "checked" : "true" }' : 'null') + ' } ');
		
		query += ' update' + radiatorId + ': change_multiple_column_values(item_id: ' + radiatorId + ', board_id: ' + id_radiatorBoard + ', column_values: ' + radiatorColumnJson + ') { id }';
	});
	
	query += ' } ';
	
	mondayAPI(query, function(data) {
		UIkit.notification('Radiators saved', 'success');
	});
	
}