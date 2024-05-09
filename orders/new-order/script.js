getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getSuppliers();
	
	gbc('#item-add').on('click', function(e) {
		addItemToOrder();
	});
	
	gbc('#item-quantity, #item-powder').on('keyup', function(e) {
		if (e.keyCode === 13) {
			addItemToOrder();
		}
	});
	
	gbc('#order-save').on('click', function(e) {
		saveOrder();
	});
});

function getSuppliers() {
	let query = ' { boards(ids:' + id_suppliersBoard + ') { items_page(limit:500, query_params:{ order_by: {column_id: "name"} }) { items { id name } } } } ';
	
	mondayAPI(query, function(data) {
		
		let suppliers = data['data']['boards'][0]['items_page']['items'];
		
		var html = '';
		
		html += '<option value="" disabled selected>supplier</option>';
		
		for (var i = 0; i < suppliers.length; i++) {
			let supplier = suppliers[i];
			
			html += '<option value="' + supplier.id + '">' + supplier.name + '</option>';
		}
		
		gbc('#order-supplier').html(html);
		
		checkForHash();
		getNewOrderNumber();
	});
}

function addItemToOrder() {
	let quantity = gbc('#item-quantity').val();
	let powder = gbc('#item-powder').val();
	
	if (quantity == '') {
		UIkit.notification('Enter a powder quantity', 'warning');
		return false;
	}
	
	if (powder == '') {
		UIkit.notification('Enter a powder colour', 'warning');
		return false;
	}
	
	let existingItems = gbc('#order-items').val();
	
	let comma = ((existingItems == '') ? '' : ', ');
	
	let boxPlural = ('box' + (quantity == 1 ? '' : 'es'));
	gbc('#order-items').val(existingItems + comma + quantity + ' ' + boxPlural + ' of ' + powder);
	
	gbc('#item-quantity').val('').focus();
	gbc('#item-powder').val('');
}

function getNewOrderNumber() {
	let query = ' { boards(ids:' + id_ordersBoard + ') { items_page( limit: 1 query_params: { rules: [ {column_id: "' + id_ordersBoardOrderNumber + '", compare_value: [null], operator: is_not_empty} ], order_by: {column_id: "' + id_ordersBoardOrderNumber + '", direction: desc } } ) { items { id name column_values( ids: ["' + id_ordersBoardOrderNumber + '"] ) { id text } } } } } ';
	
	mondayAPI(query, function(data) {
		
		let orders = data['data']['boards'][0]['items_page']['items'];
		
		if (orders.count == 0) {
			displayError('No previous orders (getNewOrderNumber)');
			return false;
		}
		
		let lastOrder = orders[0];
		
		let lastOrderNumber = parseInt(columnText(lastOrder, id_ordersBoardOrderNumber));
		let newOrderNumber = lastOrderNumber += 1;
		gbc('#order-number').text(newOrderNumber);
	});
}

function saveOrder() {
	let newOrderNumber = gbc('#order-number').text();
	let newOrderSupplier = gbc('#order-supplier').val();
	let newOrderItems = gbc('#order-items').val();
	
	if (newOrderNumber == '') {
		displayError('No previous order number (saveOrder)');
		return false;
	}
	
	if (newOrderSupplier == '') {
		UIkit.notification('Please select a supplier', 'warning');
		return false;
	}
	
	if (newOrderItems == '') {
		UIkit.notification('Please enter the items ordered', 'warning');
		return false;
	}
	
	let newOrderJson = JSON.stringify(' { "' + id_ordersBoardSupplier + '" : { "item_ids": [' + newOrderSupplier + '] }, "' + id_ordersBoardOrderNumber + '": "' + newOrderNumber + '" } ');
	
	let query = ' mutation { create_item (board_id: ' + id_ordersBoard + ', group_id: "topics", item_name: "' + newOrderItems + ' (' + userName + ')", column_values: ' + newOrderJson + ') { id } } ';
	
	mondayAPI(query, function(data2) {
		let newOrderNumberAfterSave = parseInt(newOrderNumber) + 1;
		
		gbc('#order-number').text(newOrderNumberAfterSave);
		gbc('#order-supplier').val('');
		gbc('#order-items').val('');
		
		UIkit.notification('Order added', 'success');
	});
}

function checkForHash() {
	let hash = window.location.hash;
	
	if (hash) {
		hash = hash.substring(1);
		gbc('#order-supplier').val(hash);
		gbc('#item-quantity').focus();
	}
}