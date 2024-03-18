getStarted();

document.addEventListener("DOMContentLoaded", function() {
	gbc('#delivery-date-time').on('change', function(e) {
		getPallets();
	});
	
	getDeliveries();
});

function getDeliveries() {
	let query = ' { boards(ids:' + id_deliveryBoard + ') { items_page (limit:500, query_params: { rules: [ { column_id: "' + id_deliveryBoardDate + '", compare_value: ["TODAY"], operator: greater_than_or_equals}, {column_id: "' + id_deliveryBoardPallets + '", compare_value: [null], operator:is_not_empty } ], operator: or } ) { items { ' + fields_deliveries + ' } } } } ';
	
	mondayAPI(query, function(data) {
		let deliveries = new Deliveries(data);
		
		if (deliveries.all.length == 0) {
			displayError('No deliveries orders (getDeliveries)');
			return false;
		}
		
		var html = '';
		
		if (deliveries.undeliveredCount == 0) {
			html += '<option value="" selected disabled>All deliveries complete today.</option>';
		}
		
		for (var i = 0; i < deliveries.all.length; i++) {
			let delivery = deliveries.all[i];
			
			if (delivery.status != 'Delivered') {
				html += '<option value="' + delivery.id + '">' + delivery.friendlyDate + ' ' + delivery.name + '</option>';
			}
		}
		
		gbc('#delivery-date-time').html(html);
		
		getPallets();
	});
}

function getPallets() {
	gbc('#page').hide();
	
	let deliveryDateTime = gbc('#delivery-date-time').val();
	
	if (deliveryDateTime != '') {
		let query = ' { boards (ids: [' + id_palletBoard + ']) { items_page (query_params: { rules: [ { column_id : "' + id_palletBoardDeliveryTime + '", compare_value: [null], operator:is_empty } ] } ) { items { ' + fields_pallets + ' } } } } ';
		
		mondayAPI(query, function(data) {
			
			let pallets = new Pallets(data);
			
			if (pallets.all.length == 0) {
				displayError('No pallets (getPallets)');
				return false;
			}
			
			var html = '';
			
			html += '<ul class="uk-list uk-list-striped">';
			
			for (var i = 0; i < pallets.all.length; i++) {
				let pallet = pallets.all[i];
				
				var onDelivery = '';
				var checkboxStatus = '';
				
				if (deliveryDateTime == pallet.deliveryId) {
					checkboxStatus = ' checked';
				} 
				else if ((pallet.delivery != '') && (pallet.delivery != undefined)) {
					checkboxStatus += ' checked disabled';
					onDelivery = ' (delivery ' + fixDate(pallet.deliveryDate) + ' ' + pallet.delivery + ')';
				}
				
				html += '<li>';
				html += '<label>';
				html += '<input class="uk-checkbox" type="checkbox" id="' + pallet.id + '"' + checkboxStatus + '> ';
				html += 'Pallet ' + pallet.name + onDelivery + ' [' + pallet.radiatorText + ']';
				html += '</label>'
				html += '</li>';
			}
			
			html += '</ul>';
			html += '<div><button class="uk-button uk-button-primary uk-width-1-1" id="delivery-save">Save</button></div>';
			
			gbc('#page').html(html).show();
			
			gbc('#delivery-save').on('click', function(e) {
				saveDelivery();
			});
		});
	}
}

function saveDelivery() {
	let deliveryDateTime = gbc('#delivery-date-time').val();
	
	var palletIds = [];
	var palletQuery = '';
	
	gbc('#page ul input[type=checkbox]:checked:not(:disabled)').each(function(pallet) {
		palletIds.push(pallet.id); // get all selected pallets
	});
	
	if (palletIds.length == 0) {
		palletQuery = JSON.stringify(' { "' + id_deliveryBoardPallets + '" : null } ');
	} else {
		palletQuery = JSON.stringify(' { "' + id_deliveryBoardPallets + '" : { "item_ids": [' + palletIds.join(',') + '] } } ');
	}
	
	let query = ' mutation { change_multiple_column_values(item_id: ' + deliveryDateTime + ', board_id: ' + id_deliveryBoard + ', column_values: ' + palletQuery + ') { id } } ';
	
	mondayAPI(query, function(data) {
		UIkit.notification('Radiators saved', 'success');
	});
}