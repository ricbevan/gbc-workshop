getStarted();

document.addEventListener("DOMContentLoaded", function() {
	gbc('#delivery-date-time').on('change', function(e) {
		getDelivery();
	});
	
	getDeliveries();
});

function getDeliveries() {
	let query = ' { boards(ids:' + id_deliveryBoard + ') { items_page (limit:500, query_params: { rules: [ { column_id : "' + id_deliveryBoardSignature + '", compare_value: [null], operator: is_not_empty } ] } ) { items { ' + fields_deliveries + ' } } } } ';
	
	mondayAPI(query, function(data) {
		let deliveries = new Deliveries(data);
		
		var html = '';
		
		if (deliveries.all.length == 0) {
			html += '<option value="" selected disabled>There are currently no deliveries that have been signed for.</option>';
		}
		
		for (var i = 0; i < deliveries.all.length; i++) {
			let delivery = deliveries.all[i];
			
			html += '<option value="' + delivery.id + '">' + delivery.friendlyDate + ' ' + delivery.name + '</option>';
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
			html += '<dd style="white-space: pre-wrap">' + delivery.status + '</dd>';
			
			if (delivery.status == 'Delivered') {
				html += '<dt>Date & time delivered</dt>';
				html += '<dd>' + delivery.friendlyDate + ' ' + delivery.time + '</dd>';
				html += '<dt>Driver</dt>';
				html += '<dd>' + delivery.driver + '</dd>';
			}
			
			html += '<dt>Pallets</dt>';
			html += '<dd><ul class="uk-list uk-list-striped">';
			
			let pallets = delivery.pallets.split(', ');
			
			if (delivery.pallets == '') {
				html += '<li>There are currently no pallets on this delivery.</li>';
			} else {
				for (var i = 0; i < pallets.length; i++) {
					let pallet = pallets[i];
					html += '<li>Pallet ' + pallet + '</li>';
				}
			}
			
			html += '</ul></dd>';
			html += '</dl> </div>';
			
			if (workshop) {
				if (delivery.radiators != '') {
					html += ' <div class="uk-margin-remove"> <ul uk-accordion> <li> ';
					html += ' <a class="uk-accordion-title uk-text-uppercase uk-text-small" href>Radiators</a> <p class="uk-accordion-content"> ';
					html += decodeURIComponent(delivery.radiators);
					html += ' </p> </li> </ul> </div> ';
				}
			}
			
			html += '<div class="uk-flex uk-flex-center uk-margin-top">';
			
			html += '<div hidden>';
			html += '<canvas id="canvas" class="uk-padding-remove" id="signature-canvas">Canvas is not supported</canvas>';
			html += '<div class="uk-margin-top">';
			html += '<button class="uk-button uk-button-primary uk-margin-small-right" id="save-pod">Save</button>';
			html += '<button class="uk-button uk-button-danger" id="clear-signature">Clear</button>';
			html += '</div>';
			html += '</div>';
			html += '<img id="signature"' + ((delivery.status == 'Delivered') ? '' : ' hidden') + ' />';
			
			html += '</div>';
			
			gbc('#page').show().html(html);
			
			if (delivery.status == 'Delivered') {
				document.getElementById('signature').setAttribute('src', decodeURIComponent(delivery.signature));
			}
		});
	}
}