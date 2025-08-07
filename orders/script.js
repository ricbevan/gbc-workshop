getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getFavouriteSuppliers();
});

function getFavouriteSuppliers() {
	// let query = ' { boards(ids:' + id_suppliersBoard + ') { items_page(limit:500, query_params:{ rules: [ { column_id:"' + id_suppliersBoardCommon + '", compare_value: [null], operator: is_not_empty } ] order_by: [{column_id: "name"}]}) { items { id name } } } } ';
	
	let query = ' { boards(ids:' + id_suppliersBoard + ') { items_page(limit:500, query_params:{ rules: [ { column_id:"' + id_suppliersBoardCommon + '", compare_value: [""], operator: is_not_empty } ] order_by: [{column_id: "name"}]}) { items { id name } } } } ';
	
	mondayAPI(query, function(data) {
		
		let suppliers = data['data']['boards'][0]['items_page']['items'];
		
		console.log(suppliers);
		
		var html = '';
		
		for (var i = 0; i < suppliers.length; i++) {
			let supplier = suppliers[i];
			
			html += '<div>';
			html += '<a href="./new-order#' + supplier.id + '" class="uk-card uk-card-default uk-card-small uk-card-body uk-light uk-card-hover gbc-blue">';
			html += '<h3 class="uk-card-title">New ' + supplier.name + ' Order</h3>';
			html += '</a>';
			html += '</div>';
		}
		
		gbc('#supplier-orders').html(html);
	});
}