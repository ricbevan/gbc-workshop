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
	
	let query = ' { boards(ids: [' + id_radiatorBoard + ']) { items_page( limit: 500, query_params: { rules: [{column_id: "group", compare_value: ["' + purchaseOrderId + '"], operator:any_of}] }) { items { ' + fields_radiators + ' } } } } ';
	
	console.log(query);
	
	mondayAPI(query, function(data) {
		let radiators = new Radiators(data);
		
		var colours = [];
		var pallets = [];
		
		var html = '';
		html += '<div>';
		html += '<ul class="uk-list uk-list-striped">';
		
		for (var i = 0; i < radiators.all.length; i++) {
			let radiator = radiators.all[i];
			
			console.log(radiator);
			
			let received = '<span uk-icon="icon: arrow-right"></span> In on pallet ' + radiator.inPallet + ((radiator.received) ? ' (received)' : '');
			let delivered = '<span uk-icon="icon: arrow-left"></span> ' + ((radiator.outPallet == undefined) ? 'Not sent' : ('Out on pallet ' + radiator.outPallet)) + ((radiator.deliveryTime != '') ? (' (sent on ' + fixDate(radiator.deliveryDate) + ')') : '');
			
			html += '<li data-colour="' + alphanumeric(radiator.colour) + '" data-pallet="' + alphanumeric(radiator.inPallet) + '">';
			html += '<div class="uk-flex uk-flex-middle" uk-grid>';
			html += '<div class="uk-width-expand" uk-grid>';
			html += '<div class="uk-width-auto">';
			html += '<p class="uk-margin-remove">[' + radiator.colour + '] ' + radiator.name + '</p>';
			html += '<p class="uk-text-light uk-text-small uk-margin-remove">' + received + '</p>';
			html += '<p class="uk-text-light uk-text-small uk-margin-remove">' + delivered + '</p>';
			html += '</div>';
			html += '<div class="uk-flex uk-flex-middle uk-margin-remove">';
			html += radiator.radiatorTypeLabel;
			html += '</div>';
			html += '</div>';
			html += '<div class="uk-width-auto">';
			html += '<span uk-icon="' + radiator.icon + '" uk-tooltip="' + radiator.status + '" id="' + radiator.id + '" class="radiator-info ' + radiator.style + '"></span>';
			html += '</div>';
			html += '</div>';
			html += '</li>';
			
			colours.push(radiator.colour);
			pallets.push(radiator.inPallet);
		}
		
		html += '</ul>';
		html += '</div>';
		
		gbc('#page').html(html).show();
		
		gbc('.radiator-info').on('click', function(e) {
			let radiatorId = e.target.closest('span').id;
			getRadiatorComments(radiatorId, getPurchaseOrderRadiators);
		});
		
		colours = [... new Set(colours)].sort(); // get unique colours, sorted
		pallets = [... new Set(pallets)].sort(); // get unique pallets, sorted
		
		html = ''; // clear html (as already set above)
		
		html += '<div>';
		html += filterHtml(colours, 'Colour', 'colour');
		html += '</div>';
		html += '<div>';
		html += filterHtml(pallets, 'Pallet', 'pallet');
		html += '</div>';
		
		gbc('#filters').show().html(html);
		
		gbc('#filters select').on('change', function(e) {
			filter();
		});
		
	});
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
	let pallet = gbc('#filter-pallet').val();
	
	var filters = ((colour != 'all' ? '[data-colour="' + colour + '"]' : '') + (pallet != 'all' ? '[data-pallet="' + pallet + '"]' : ''));
	filters = (filters == '' ? 'li' : ' ' + filters);
	
	gbc('#page li').hide();
	gbc('#page ' + filters).show();
}