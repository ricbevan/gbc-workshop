getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getOrders();
	
	gbc('#order-search').on('keyup', function(e) {
		filter();
	});
});

function getOrders() {
	let query = ' { boards(ids:' + id_ordersBoard + ') { groups(ids:["topics"]) { items_page( limit: 500, query_params: { rules: [ { column_id:"' + id_ordersBoardReceived + '", compare_value: [null], operator: is_empty } ] } ) { items { id name column_values(ids: [ "' + id_ordersBoardOrderNumber + '", "' + id_ordersBoardReceived + '", "' + id_ordersBoardSupplier + '", "' + id_ordersBoardPartial + '", "' + id_ordersBoardCreated + '"] ) { id text ... on BoardRelationValue { display_value } } } } } } }';
	
	mondayAPI(query, function(data) {
		
		let orders = data['data']['boards'][0]['groups'][0]['items_page']['items'];
		
		var html = '<ul class="uk-list uk-list-divider uk-width-1-1" id="orders">';
		
		for (var i = 0; i < orders.length; i++) {
			let order = orders[i];
			
			let orderNumber = columnText(order, id_ordersBoardOrderNumber);
			let partiallyReceived = columnText(order, id_ordersBoardPartial);
			let created = columnText(order, id_ordersBoardCreated);
			let orderSupplier = linkedColumnText(order, "link_to_item");
			
			let partiallyReceivedHtml = (partiallyReceived ? '<span class="uk-label uk-label-warning uk-margin-small-left">Partially received</span>' : '');
			
			html += '<li class="gbc-box-link uk-flex uk-flex-middle" data-order-id="' + order.id + '"><span>Order <span class="uk-text-emphasis">' + orderNumber + '</span>: ' + order.name + ' <span class="uk-text-muted">from ' + orderSupplier + ' [' + fixDateShort(created) + ']</span>' + partiallyReceivedHtml + '</span></li>';
		}
		
		html += '</ul>';
		
		gbc('#page').show().html(html);
		gbc('#orders li').on('click', function(e) {
			manageOrder(e);
		});
	});
}

function filter() {
	let searchFor = gbc('#order-search').val();
	
	gbc('#orders li').each(function(e) {
		e.setAttribute('hidden', true);
		
		if (e.innerText.toLowerCase().includes(searchFor.toLowerCase())) {
			e.removeAttribute('hidden');
		}
	});
}

function manageOrder(e) {
	e.preventDefault();
	
	let orderId = e.target.closest('li').getAttribute('data-order-id');
	
	var html = '<button class="uk-modal-close-outside" type="button" uk-close></button><div class="uk-modal-body"><div class="uk-child-width-1-2 uk-grid-match" uk-grid>';
	html += '<div><button class="uk-button uk-button-secondary uk-width-1-1" id="part-receive">Part Received</button></div>';
	html += '<div><button class="uk-button uk-button-success uk-width-1-1" id="receive">Received</button></div>';
	html += '</div></div>';
	
	UIkit.modal.dialog(html);
	
	gbc('#part-receive').on('click', function(e) {
		orderPartReceived(orderId);
	});
	
	gbc('#receive').on('click', function(e) {
		orderReceived(orderId);
	});
}

function orderReceived(orderId) {
	let receivedJson = JSON.stringify(' { "' + id_ordersBoardReceived + '" : { "checked" : "true" } } ');
	
	query = ' mutation { change_multiple_column_values(item_id: ' + orderId + ', board_id: ' + id_ordersBoard + ', column_values: ' + receivedJson + ') { id } } ';
	
	mondayAPI(query, function(data) {
		UIkit.notification('Order received', 'success');
		getOrders();
		gbc('.uk-modal').removeClass('uk-open');
		gbc('html').removeClass('uk-modal-page');
	});
}

function orderPartReceived(orderId) {
	let receivedJson = JSON.stringify(' { "' + id_ordersBoardPartial + '" : { "checked" : "true" } } ');
	
	query = ' mutation { change_multiple_column_values(item_id: ' + orderId + ', board_id: ' + id_ordersBoard + ', column_values: ' + receivedJson + ') { id } } ';
	
	mondayAPI(query, function(data) {
		UIkit.notification('Order partially received', 'success');
		getOrders();
		gbc('.uk-modal').removeClass('uk-open');
		gbc('html').removeClass('uk-modal-page');
	});
}














