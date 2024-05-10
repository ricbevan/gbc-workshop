getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getOrders();
	
	gbc('#order-search').on('keyup', function(e) {
		filter();
	});
});

function getOrders() {
	let query = ' { boards(ids:' + id_ordersBoard + ') { items_page( limit: 500, query_params: { rules: [ { column_id:"' + id_ordersBoardOrderNumber + '", compare_value: [null], operator: is_not_empty } ] order_by: {column_id: "' + id_ordersBoardOrderNumber + '", direction: desc } } ) { items { id name column_values(ids: [ "' + id_ordersBoardOrderNumber + '", "' + id_ordersBoardReceived + '", "' + id_ordersBoardSupplier + '", "' + id_ordersBoardPartial + '", "' + id_ordersBoardCreated + '"] ) { id text ... on BoardRelationValue { display_value } } } } } }';
	
	mondayAPI(query, function(data) {
		
		let orders = data['data']['boards'][0]['items_page']['items'];
		
		var html = '<ul class="uk-list uk-list-divider uk-width-1-1" id="orders">';
		
		for (var i = 0; i < orders.length; i++) {
			let order = orders[i];
			
			let orderNumber = columnText(order, id_ordersBoardOrderNumber);
			let received = (columnText(order, id_ordersBoardReceived) ? true : false);
			let partiallyReceived = (columnText(order, id_ordersBoardPartial) ? true : false);
			let created = columnText(order, id_ordersBoardCreated);
			let orderSupplier = linkedColumnText(order, "link_to_item");
			
			let partiallyReceivedHtml = (received ? '<span class="uk-label uk-label-success uk-margin-small-left">Received</span>' : (partiallyReceived ? '<span class="uk-label uk-label-warning uk-margin-small-left">Partially received</span>' : ''));
			
			let css = ((received || partiallyReceived) ? 'gbc-box-link ' : '');
			
			html += '<li class="' + css + 'uk-flex uk-flex-middle" data-order-id="' + order.id + '" data-order-received="' + (received || partiallyReceived) + '"><span>Order <span class="uk-text-emphasis">' + orderNumber + '</span>: ' + order.name + ' <span class="uk-text-muted">from ' + orderSupplier + ' [' + fixDateShort(created) + ']</span>' + partiallyReceivedHtml + '</span></li>';
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
	
	let received = e.target.closest('li').getAttribute('data-order-received');
	
	if (received == 'true') {
		let orderId = e.target.closest('li').getAttribute('data-order-id');
		
		var html = '<button class="uk-modal-close-outside" type="button" uk-close></button><div class="uk-modal-body"><div class="uk-child-width-1-1" uk-grid>';
		html += '<div><button class="uk-button uk-button-danger uk-width-1-1" id="unreceive">Mark As Not Received</button></div>';
		html += '</div></div>';
		
		UIkit.modal.dialog(html);
		
		gbc('#unreceive').on('click', function(e) {
			orderUnreceived(orderId);
		});
	}
}

function orderUnreceived(orderId) {
	let receivedJson = JSON.stringify(' { "' + id_ordersBoardReceived + '" : null, "' + id_ordersBoardPartial + '" : null } ');
	
	query = ' mutation { change_multiple_column_values(item_id: ' + orderId + ', board_id: ' + id_ordersBoard + ', column_values: ' + receivedJson + ') { id } } ';
	
	mondayAPI(query, function(data) {
		UIkit.notification('Order marked as not received', 'success');
		getOrders();
		gbc('.uk-modal').removeClass('uk-open');
		gbc('html').removeClass('uk-modal-page');
	});
}












