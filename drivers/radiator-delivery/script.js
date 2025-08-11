getStarted();

document.addEventListener("DOMContentLoaded", function() {
	gbc('#delivery-date-time').on('change', function(e) {
		getDelivery();
	});
	
	getDeliveries();
});

function getDeliveries() {
	// let query = ' { boards(ids:' + id_deliveryBoard + ') { items_page (limit:500, query_params: { rules: [ { column_id : "' + id_deliveryBoardSignature + '", compare_value: [null], operator: is_empty }, {column_id: "' + id_deliveryBoardPallets + '", compare_value: [null], operator:is_not_empty } ], operator: and } ) { items { ' + fields_deliveries + ' } } } } ';
	
	let query = ' { boards(ids:' + id_deliveryBoard + ') { items_page (limit:500, query_params: { rules: [ { column_id : "' + id_deliveryBoardSignature + '", compare_value: [""], operator: is_empty }, {column_id: "' + id_deliveryBoardPallets + '", compare_value: [""], operator:is_not_empty } ], operator: and } ) { items { ' + fields_deliveries + ' } } } } ';
	
	mondayAPI(query, function(data) {
		let deliveries = new Deliveries(data);
		
		if (deliveries.all.length == 0) {
			displayError('No deliveries orders (getDeliveries) - this may be because all deliveries have been signed for today');
			return false;
		}
		
		var html = '';
		
		if (deliveries.undeliveredCount == 0) {
			html += '<option value="">All deliveries complete today.</option>';
		}
		
		for (var i = 0; i < deliveries.all.length; i++) {
			let delivery = deliveries.all[i];
			
			if (delivery.status != 'Delivered') {
				html += '<option value="' + delivery.id + '">' + delivery.friendlyDate + ' ' + delivery.name + '</option>';
			}
		}
		
		gbc('#delivery-date-time').html(html);
		
		getDelivery();
	});
}

function getDelivery() {
	let deliveryDateTime = gbc('#delivery-date-time').val();
	
	if (deliveryDateTime != '') {
		let query = ' { boards(ids:' + id_deliveryBoard + ') { items_page(limit: 1, query_params: { ids: [' + deliveryDateTime + ']}) { items { ' + fields_deliveries + ' } } } } ';
		
		mondayAPI(query, function(data) {
			let deliveries = new Deliveries(data);
			
			if (deliveries.all.length == 0) {
				displayError('No delivery [ID: ' + deliveryDateTime + '] (getDelivery)');
				return false;
			}
			
			let delivery = deliveries.all[0];
			
			html = '';
			
			html += '<div> <dl class="uk-description-list">';
			html += '<dt>Status</dt>';
			html += '<dd>' + delivery.status + '</dd>';
			
			if (delivery.status == 'Delivered') {
				html += '<dt>Date & time delivered</dt>';
				html += '<dd>' + delivery.friendlyDate + ' ' + delivery.time + '</dd>';
				html += '<dt>Driver</dt>';
				html += '<dd>' + delivery.driver + '</dd>';
			}
			
			html += '</dl> </div>';
			
			if (delivery.pallets != '') {
				let pallets = delivery.pallets.split(', ');
				
				if (pallets.length > 0) {
					html += '<div class="uk-margin-top"> <ul class="uk-list uk-list-striped">';
					
					for (var i = 0; i < pallets.length; i++) {
						let pallet = pallets[i];
						
						html += '<li>Pallet ' + pallet + '</li>';
					}
					
					html += '</ul> </div>';
				}
			}
			
			html += '<div class="uk-flex uk-flex-center uk-margin-top">';
			
			html += '<div' + ((delivery.status == 'Delivered') ? ' hidden' : '') + '>';
			html += '<canvas id="canvas" class="uk-padding-remove" id="signature-canvas">Canvas is not supported</canvas>';
			html += '<div class="uk-margin-top">';
			html += '<button class="uk-button uk-button-primary uk-margin-small-right" id="save-pod">Save</button>';
			html += '<button class="uk-button uk-button-danger" id="clear-signature">Clear</button>';
			html += '</div>';
			html += '</div>';
			html += '<img id="signature"' + ((delivery.status == 'Delivered') ? '' : ' hidden') + ' />';
			
			html += '</div>';
			
			gbc('#page').show().html(html);
			
			initialiseSignature();
			
			if (delivery.status == 'Delivered') {
				document.getElementById('signature').setAttribute('src', decodeURIComponent(delivery.signature));
			}
			
			gbc('#save-pod').on('click', function(e) {
				saveDelivery();
			});
			
			gbc('#clear-signature').on('click', function(e) {
				initialiseSignature();
			});
		});
	}
}

function saveDelivery() {
	if(!isSign) {
		UIkit.notification('Please sign the form before saving', 'danger');
		return false;
	}
	
	getDeliveryPallets();
}

// these functions update all radiators and pallets on the delivery, and the delivery itself
// (1/3) first, get all pallet ids that are on the delivery
function getDeliveryPallets() { // get pallet ids on delivery
	let deliveryDateTime = gbc('#delivery-date-time').val();
	
	let query = ' { boards(ids:' + id_palletBoard + ') { items_page(limit: 500, query_params: {rules: [{ column_id: "' + id_palletBoardDelivery + '", compare_value: [' + deliveryDateTime + '], operator:any_of}] } ) { items { ' + fields_pallets + ' } } } } ';
	
	mondayAPI(query, function(data) {
		let pallets = new Pallets(data);
		
		var palletIdsOnDelivery = [];
		
		for (var i = 0; i < pallets.all.length; i++) {
			let pallet = pallets.all[i];
			
			palletIdsOnDelivery.push(pallet.id);
		}
		
		getDeliveryRadiators(palletIdsOnDelivery);
	});
}

// these functions update all radiators and pallets on the delivery, and the delivery itself
// (2/3) next, get all radiator ids that are contained any of the pallet ids just retrieved
function getDeliveryRadiators(palletIdsOnDelivery) { // get radiator ids on delivery
	let query = ' { boards(ids:' + id_radiatorBoard + ') { items_page(limit: 500, query_params: {rules: [{ column_id: "' + id_radiatorBoardOutPallet + '", compare_value: [' + palletIdsOnDelivery + '], operator:any_of}] } ) { items { ' + fields_radiators + ' } } } } ';
	
	mondayAPI(query, function(data) {
		let radiators = new Radiators(data);
		
		var radiatorsOnDelivery = '';
		var radiatorIdsOnDelivery = [];
		
		for (var i = 0; i < radiators.all.length; i++) {
			let radiator = radiators.all[i];
			
			radiatorsOnDelivery += radiator.name + ' [' + radiator.colour + '] - ' + radiator.friendlyPurchaseOrderName + ' (out on pallet ' + radiator.outPallet + ')<br />';
			radiatorIdsOnDelivery.push(radiator.id);
		}
		
		deliveryUpdate(palletIdsOnDelivery, radiatorIdsOnDelivery, radiatorsOnDelivery)
	});
}

// these functions update all radiators and pallets on the delivery, and the delivery itself
// (3/3) using the retrieved pallet & radiator ids, generate queries for pallets, radiators
// and the delivery; all are combined into a single query
function deliveryUpdate(palletIdsOnDelivery, radiatorIdsOnDelivery, radiatorsOnDelivery) { // create update queries from pallet ids, and radiator ids
	var query2 = 'mutation {';
	
	query2 += deliveryPalletsUpdateQuery(palletIdsOnDelivery);
	query2 += deliveryRadiatorsUpdateQuery(radiatorIdsOnDelivery);
	query2 += deliveryUpdateQuery(radiatorsOnDelivery);
	
	query2 += ' } ';
	
	console.log(query2);
	
	mondayAPI(query2, function(data) {
		UIkit.notification('Delivery saved', 'success');
	});
}

// this function takes a list of pallet ids and creates an update query for each one, setting it marked as delivered
function deliveryPalletsUpdateQuery(palletIdsOnDelivery) { // create update query for pallets
	var query = '';
	
	for (var j = 0; j <= palletIdsOnDelivery.length; j++) {
		let palletId = palletIdsOnDelivery[j];
		
		if ((palletId != undefined) && (palletId != '')) {
			let checkboxJson = JSON.stringify(' {"check__1" : {"checked" : "true"}} ');
			
			query += ' updatePallet' + j + ': change_multiple_column_values(item_id:' + palletId + ', board_id:' + id_palletBoard + ', column_values: ' + checkboxJson + ') { id } ';
		}
	}
	
	return query;
}

// this function takes a list of radiator ids and creates an update query for each one, setting it marked as delivered
function deliveryRadiatorsUpdateQuery(radiatorIdsOnDelivery) { // create update query for radiators
	var query = '';
	
	for (var j = 0; j <= radiatorIdsOnDelivery.length; j++) {
		let radiatorId = radiatorIdsOnDelivery[j];
		
		if ((radiatorId != undefined) && (radiatorId != '')) {
			let checkboxJson = JSON.stringify(' {"check__1" : {"checked" : "true"}} ');
			
			query += ' updateRadiator' + j + ': change_multiple_column_values(item_id:' + radiatorId + ', board_id:' + id_radiatorBoard + ', column_values: ' + checkboxJson + ') { id } ';
		}
	}
	
	return query;
}

// this function takes a list of all radiators (
function deliveryUpdateQuery(radiatorsOnDelivery) { // create update query for delivery
	let deliveryDateTime = gbc('#delivery-date-time').val();
	let signature = document.getElementById('canvas').toDataURL();
	
	const currentDate = new Date();
	
	const currentHour = currentDate.getHours();
	const currentMinute = currentDate.getMinutes();
	
	var query = ' updateDelivery: ';
	
	var personUpdate = '"' + id_deliveryBoardDriver + '": {"personsAndTeams": [{"id": ' + userId + ', "kind": "person"}] }, ';
	var hourUpdate = '"' + id_deliveryBoardTime + '" : {"hour" : ' + currentHour + ', "minute" : ' + currentMinute + '}, ';
	var signatureUpdate = '"' + id_deliveryBoardSignature + '" : "' + encodeURIComponent(signature) + '", ';
	var radiatorUpdate = '"' + id_deliveryBoardRadiators + '" : "' + encodeURIComponent(radiatorsOnDelivery) + '"';
	
	var updates = JSON.stringify(' { ' + personUpdate + hourUpdate + signatureUpdate + radiatorUpdate + ' } ');
	
	query += 'change_multiple_column_values(item_id: ' + deliveryDateTime + ', board_id: ' + id_deliveryBoard + ', column_values: ' + updates + ') { id }';
	
	return query;
}