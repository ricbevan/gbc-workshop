getStarted();

var radiators, selectedRadiator;

document.addEventListener("DOMContentLoaded", function() {
	gbc('#goods-out-pallet').on('change', function(e) {
		selectedRadiator = gbc('#goods-out-pallet').val();
		getRadiators();
	});
	
	gbc('#add-pallets').on('click', function(e) {
		addPallets();
	});
	
	gbc('#print-page').on('click', function(e) {
		let radiatorsNotSaved = (gbc('#page ul input[type=checkbox][data-changed="true"]').count() > 0);
		
		if (radiatorsNotSaved) {
			let confirmText = 'Radiators on this pallet have changed, but not been saved. Save and print?';
			
			if (confirm(confirmText) == true) {
				saveRadiators(function() { getPallets(); printPage(); });
			}
		} else {
			printPage();
		}
	});
	
	getPallets();
});

function getPallets() {
	// let query = ' { boards (ids: [' + id_palletBoard + ']) { items_page(limit:500, query_params: { rules: [ { column_id : "' + id_palletBoardDeliveryTime + '", compare_value: [null], operator:is_empty } ] } ) { items { ' + fields_pallets + ' } } } } ';
	
	let query = ' { boards(ids: [' + id_palletBoard + ']) { items_page( limit: 500 query_params: {rules: [{column_id: "check__1", compare_value: [null], operator: is_empty}]} ) { items { id name column_values(ids:["link_to_radiators_2"]) { id text ... on BoardRelationValue { linked_item_ids } } } } } } ';
	
	console.log(query);
	
	mondayAPI(query, function(data) {
		console.log(data);
		let pallets = new Pallets(data);
		let palletsReversed = pallets.all.reverse();
		
		if (palletsReversed.length == 0) {
			displayError('No pallets (getPallets)');
			return false;
		}
		
		var html = '';
		
		for (var i = 0; i < palletsReversed.length; i++) {
			let pallet = palletsReversed[i];
			
			let radiatorCount = ((pallet.radiatorCount > 0) ? (' (' + pallet.radiatorText + ')') : '');
			
			html += '<option value="' + pallet.id + '">Pallet ' + pallet.name + radiatorCount + '</option>';
		}
		
		gbc('#goods-out-pallet').html(html);
		
		if (selectedRadiator != null) {
			gbc('#goods-out-pallet').val(selectedRadiator);
		}
		
		getRadiators();
	});
}

function getRadiators() {
	// let query = ' { boards (ids: [' + id_radiatorBoard + ']) { items_page (limit: 500, query_params: {rules: [{ column_id: "' + id_radiatorBoardOutReceived + '", compare_value: [null], operator:is_not_empty }, { column_id: "' + id_radiatorBoardOutPalletDispatchTime + '", compare_value: [null], operator:is_empty }], operator: and }) { cursor items { ' + fields_radiators + ' } } } } ';
	
	let query = ' { boards(ids: [5856106281]) { items_page( limit: 500 query_params: {rules: [{column_id: "checkbox", compare_value: [null], operator: is_not_empty}, {column_id: "check__1", compare_value: [null], operator: is_empty}], operator: and} ) { cursor items { id name group { title } column_values(ids:["text", "connect_boards", "check", "mirror_1", "checkbox"]) { id text ... on BoardRelationValue { display_value linked_item_ids } ... on MirrorValue { display_value } } } } } } ';
	
	mondayAPI(query, function(data) {
		radiators = new Radiators(data);
		
		let cursor = data['data']['boards'][0]['items_page']['cursor'];
		
		if (cursor) {
			getNextRadiators(cursor);
		} else {
			generateRadiators();
		}
	});
}

function getNextRadiators(cursor) {
	let query = ' { next_items_page (cursor: "' + cursor + '") { cursor items { id name group { title } column_values(ids:["text", "connect_boards", "check", "mirror_1", "checkbox"]) { id text ... on BoardRelationValue { display_value linked_item_ids } ... on MirrorValue { display_value } } } } } ';
	
	mondayAPI(query, function(data) {
		radiators.addRadiatorsFromCursor(data);
		
		let cursor = data['data']['next_items_page']['cursor'];
		
		if (cursor) {
			getNextRadiators(cursor);
		} else {
			generateRadiators();
		}
	});
}

function generateRadiators() {
	let outPalletId = gbc('#goods-out-pallet').val();
	
	var colours = [];
	var purchaseOrders = [];
	
	var html = '';
	
	html += '<div> <ul class="uk-list uk-list-divider" id="radiators">';
	
	console.log(radiators.all.length);
	
	for (var i = 0; i < radiators.all.length; i++) {
		let radiator = radiators.all[i];
		
		var checkboxStatus = '';
		var onPallet = '';
		
		if (outPalletId == radiator.outPalletId) {
			checkboxStatus = ' checked';
		} else if ((radiator.outPallet != '') && (radiator.outPallet != undefined)) {
			checkboxStatus += ' checked disabled';
			onPallet = ' (pallet ' + radiator.outPallet + ')';
		}
		
		html += '<li class="uk-flex uk-flex-middle" data-colour="' + alphanumeric(radiator.colour) + '" data-purchase-order="' + alphanumeric(radiator.purchaseOrderNameDateOnly) + '"> <label class="uk-flex-1 uk-flex uk-flex-middle">';
		html += '<input class="uk-checkbox uk-margin-small-right" type="checkbox" id="' + radiator.id + '" data-name="[' + radiator.colour + '] ' + radiator.name +  ' (' + radiator.friendlyPurchaseOrderName + ')" data-changed="false"' + checkboxStatus + ' data-quantity="' + radiator.quantity + '"> ';
		html += '[' + radiator.colour + '] ' + radiator.name + onPallet +' <span class="uk-text-nowrap uk-text-muted uk-margin-small-right uk-margin-small-left">' + radiator.friendlyPurchaseOrderName + '</span>' + radiator.radiatorTypeLabel;
		html += '</label> <span uk-icon="' + radiator.icon + '" uk-tooltip="' + radiator.status + '" id="' + radiator.id + '" class="radiator-info ' + radiator.style + '"></span> </li>';
		
		colours.push(radiator.colour);
		purchaseOrders.push(radiator.purchaseOrderNameDateOnly);
	}
	
	html += '</ul> </div>';
	
	html += '<div><button class="uk-button uk-button-primary uk-width-1-1" id="goods-out-save">Save</button></div>';
	
	gbc('#page').show().html(html);
	
	gbc('.radiator-info').on('click', function(e) {
		let radiatorId = e.target.closest('span').id;
		getRadiatorComments(radiatorId, getRadiators);
	});
	
	gbc('#goods-out-save').on('click', function(e) {
		saveRadiators(getPallets);
	});
	
	colours = [... new Set(colours)].sort(); // get unique colours, sorted
	purchaseOrders = [... new Set(purchaseOrders)].sort(); // get unique dates, sorted
	
	html = ''; // clear html (as already set above)
	
	html += '<div>';
	html += filterHtml(colours, 'Colour', 'colour');
	html += '</div>';
	html += '<div>';
	html += filterHtml(purchaseOrders, 'Purchase Order', 'purchase-order');
	html += '</div>';
	
	gbc('#filters').show().html(html);
	
	gbc('#filters select').on('change', function(e) {
		filter();
	});
	
	gbc('#page ul input[type="checkbox"]').on('click', function(e) {
		e.target.dataset.changed = "true";
		getSelectedRadiators();
	});
	
	getSelectedRadiators();
}

function getSelectedRadiators() {
	
	var html = '';
	var radiatorCount = 0;
	
	let checkboxes = gbc('#page ul input[type=checkbox]:checked:not(:disabled)');
	
	checkboxes.each(function(radiator) {
		html += '<li>' + radiator.dataset.name + '</li>';
		radiatorCount += parseInt(radiator.dataset.quantity);
	});
	
	gbc('#radiator-list').html(html);
	gbc('#item-count').html(radiatorCount);
}

function filterHtml(array, friendlyName, name) {
	var html = '';
	
	if (array.length > 0) {
		html += '<select class="uk-select" id="filter-' + name + '">';
		html += '<option value="all">' + friendlyName + '</option>';
		
		for (var i = 0; i < array.length; i++) {
			let item = array[i];
			
			html += '<option value="' + alphanumeric(item) + '">' + item + '</option>';
		}
		
		html += '</select>';
	}
	
	return html;
}

function filter() {
	let colour = gbc('#filter-colour').val();
	let purchaoseOrder = gbc('#filter-purchase-order').val();
	
	let filters = ((colour != 'all' ? '[data-colour="' + colour + '"]' : '') + (purchaoseOrder != 'all' ? '[data-purchase-order="' + purchaoseOrder + '"]' : ''));
	
	if (filters == '') { // if no filters are applied, show everything
		gbc('#page li').show();
	} else {
		gbc('#page li').hide();
		gbc('#page ' + filters).show();
	}
}

function saveRadiators(func) {
	
	let goodsOutPallet = gbc('#goods-out-pallet').val();
	
	var radiatorIds = [];
	var radiatorQuery = '';
	
	gbc('#page ul input[type=checkbox]:checked:not(:disabled)').each(function(radiator) {
		radiator.setAttribute('data-changed', 'false');
		radiatorIds.push(radiator.id); // get all selected radiators
	});
	
	if (radiatorIds.length == 0) {
		radiatorQuery = JSON.stringify(' { "' + id_palletBoardRadiators + '" : null } ');
	} else {
		radiatorQuery = JSON.stringify(' { "' + id_palletBoardRadiators + '" : { "item_ids": [' + radiatorIds.join(',') + '] } } ');
	}
	
	let query = ' mutation { change_multiple_column_values(item_id: ' + goodsOutPallet + ', board_id: ' + id_palletBoard + ', column_values: ' + radiatorQuery + ') { id } } ';
	
	mondayAPI(query, function(data) {
		UIkit.notification('Radiators saved', 'success');
		
		if (func != null) {
			func();
		}
	});
}

function addPallets() {
	let query = ' { boards(ids:[' + id_palletBoard + ']) { items_page(limit: 1, query_params: { order_by: [ {column_id:"' + id_palletBoardNumerical + '", direction: desc} ] }) { items { name } } } } ';
	
	mondayAPI(query, function(data) {
		
		let mostRecentPallet = data['data']['boards'][0]['items_page']['items'][0]['name'];
		
		if (isNaN(mostRecentPallet)) {
			displayError('Most recent pallet is not a number (addPallets)');
			return false;
		}
		
		let currentMaxPalletNumber = parseInt(mostRecentPallet);
		
		let newPalletNumberFrom = currentMaxPalletNumber + 1;
		let newPalletNumberTo = currentMaxPalletNumber + 10;
		
		let confirmText = 'Create pallets ' + newPalletNumberFrom + ' to ' + newPalletNumberTo + '?';
		
		if (confirm(confirmText) == true) {
			var query2 = 'mutation {';
			
			for (var j = newPalletNumberFrom; j <= newPalletNumberTo; j++) {
				let numericalJson = JSON.stringify(' { "' + id_palletBoardNumerical + '": "' + j + '" } ');
				
				query2 += ' update' + j + ': create_item (board_id: ' + id_palletBoard + ', group_id: "topics", item_name: "' + j + '", column_values: ' + numericalJson + ') { id }'
			}
			
			query2 += ' }';
			
			mondayAPI(query2, function(data2) {
				UIkit.notification('Radiators added', 'success');
				getPallets();
			});
		}
	});
}

function printPage() {
	let radiatorCount = gbc('#page ul input[type=checkbox]:checked:not(:disabled)').count();
	
	if (radiatorCount > 0) {
		let outPalletId = gbc('#goods-out-pallet').val();
		window.open('./print#' + outPalletId);
	} else {
		UIkit.notification('There are no radiators on this pallet to print.', 'warning');
	}
}