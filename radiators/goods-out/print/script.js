getStarted();

document.addEventListener("DOMContentLoaded", function() {
	if(window.location.hash) {
		let outPalletId = window.location.hash.substring(1);
		getRadiators(outPalletId);
	}
});

function getRadiators(outPalletId) {
	let query = ' {  boards (ids:[' + id_radiatorBoard + ']) { items_page (limit: 500, query_params: {rules: [{ column_id: "' + id_radiatorBoardOutPallet + '", compare_value: [' + outPalletId + '], operator:any_of}] } ) { items { ' + fields_radiators + ' } } } } ';
	
	mondayAPI(query, function(data) {
		let radiators = new Radiators(data);
		
		var html = '';
		
		html += '<div> <ul class="uk-list uk-list-divider" id="radiators">';
		
		if (radiators.all.length == 0) {
			html += '<li>There are no radiators on this pallet.</li>';
		} else {
			let palletNumber = 'Pallet ' + radiators.all[0].outPallet;
			let palletRadiators = '(' + radiators.all.length + ' radiator' + ((radiators.all.length == 1) ? '' : 's') + ')';
			
			gbc('#pallet-title').text(palletNumber + ' ' + palletRadiators);
		}
		
		for (var i = 0; i < radiators.all.length; i++) {
			let radiator = radiators.all[i];
			
			html += '<li>[' + radiator.colour + '] ' + radiator.name +' (' + radiator.friendlyPurchaseOrderName + ')</li>';
		}
		
		html += '</ul> </div>';
		
		gbc('#checksheet').html(html);
		
		setTimeout(function(){
			window.print();
			// window.close();
		}, 100);
	});
}