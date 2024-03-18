getStarted();

document.addEventListener("DOMContentLoaded", function() {
	gbc('#delivery-date-time').on('change', function(e) {
		getDelivery();
	});
	
	getDeliveries();
});

function getDeliveries() {
	let query = ' { boards(ids:' + id_deliveryBoard + ') { items_page (limit:500, query_params: { rules: [ { column_id : "' + id_deliveryBoardSignature + '", compare_value: [null], operator: is_empty }, {column_id: "' + id_deliveryBoardPallets + '", compare_value: [null], operator:is_not_empty } ], operator: and } ) { items { ' + fields_deliveries + ' } } } } ';
	
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
	
	getRadiators();
}

function getRadiators() {
	let deliveryDateTime = gbc('#delivery-date-time').val();
	
	let query = ' { boards(ids:' + id_radiatorBoard + ') { items_page(limit: 500, query_params: {rules: [{ column_id: "' + id_radiatorBoardOutPalletDispatch + '", compare_value: [' + deliveryDateTime + '], operator:any_of}] } ) { items { ' + fields_radiators + ' } } } } ';
	
	mondayAPI(query, function(data) {
		let radiators = new Radiators(data);
		
		var radiatorsOnDelivery = '';
		
		for (var i = 0; i < radiators.all.length; i++) {
			let radiator = radiators.all[i];
			
			radiatorsOnDelivery += radiator.name + ' [' + radiator.colour + '] - ' + radiator.friendlyPurchaseOrderName + ' (out on pallet ' + radiator.outPallet + ')<br />';
		}
		
		saveDeliveryWithRadiators(radiatorsOnDelivery);
	});
}

function saveDeliveryWithRadiators(deliveryRadiators) {
	let deliveryDateTime = gbc('#delivery-date-time').val();
	let signature = document.getElementById('canvas').toDataURL();
  
	const currentDate = new Date();
	
	const currentHour = currentDate.getHours();
	const currentMinute = currentDate.getMinutes();
  
	var query = 'mutation {';
	
	var personUpdate = '"' + id_deliveryBoardDriver + '": {"personsAndTeams": [{"id": ' + userId + ', "kind": "person"}] }, ';
	var hourUpdate = '"' + id_deliveryBoardTime + '" : {"hour" : ' + currentHour + ', "minute" : ' + currentMinute + '}, ';
	var signatureUpdate = '"' + id_deliveryBoardSignature + '" : "' + encodeURIComponent(signature) + '", ';
	var radiatorUpdate = '"' + id_deliveryBoardRadiators + '" : "' + encodeURIComponent(deliveryRadiators) + '"';
	
	var updates = JSON.stringify(' { ' + personUpdate + hourUpdate + signatureUpdate + radiatorUpdate + ' } ');
	
	query += 'change_multiple_column_values(item_id: ' + deliveryDateTime + ', board_id: ' + id_deliveryBoard + ', column_values: ' + updates + ') { id }';
	
	query += ' }';
	
	getDeliveries();
	
	mondayAPI(query, function(data) {
		UIkit.notification('Delivery saved', 'success');
	});
}