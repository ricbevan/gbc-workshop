getStarted();

document.addEventListener("DOMContentLoaded", function() {
	gbc('#out-pallet-number').on('change', function(e) {
		getPalletRadiators();
	});
	
	getPallets();
});

function getPallets() {
	let query = ' { boards (ids: [' + id_palletBoard + ']) { items_page (limit: 500) { items { ' + fields_pallets + ' } } } } ';
	
	mondayAPI(query, function(data) {
		let pallets = new Pallets(data);
		
		if (pallets.all.length == 0) {
			displayError('No pallets (getPallets)');
			return false;
		}
		
		var html = '';
		
		for (var i = 0; i < pallets.all.length; i++) {
			let pallet = pallets.all[i];
			
			let radiatorCount = ((pallet.radiatorCount > 0) ? (' (' + pallet.radiatorText + ')') : '');
			
			html += '<option value="' + pallet.id + '">Pallet ' + pallet.name + radiatorCount + '</option>';
		}
		
		gbc('#out-pallet-number').html(html);
		
		getPalletRadiators();
	});
}

function getPalletRadiators() {
	let outPalletId = gbc('#out-pallet-number').val();
	
	let query = ' { boards(ids: [' + id_radiatorBoard + ']) { items_page( query_params: { rules: [{column_id: "' + id_radiatorBoardOutPallet + '", compare_value: [' + outPalletId + '], operator:any_of}] }) { items { ' + fields_radiators + ' } } } } ';
	
	mondayAPI(query, function(data) {
		let radiators = new Radiators(data);
		
		var html = '';
		html += '<div>';
		html += '<ul class="uk-list uk-list-striped">';
		
		if (radiators.all.length == 0) {
			html += '<li>There are no radiators currently on this pallet.</li>';
		}
		
		var colours = [];
		var pallets = [];
		
		for (var i = 0; i < radiators.all.length; i++) {
			let radiator = radiators.all[i];
			
			let received = '<span uk-icon="icon: arrow-right"></span> In on pallet ' + radiator.inPallet + ((radiator.received) ? ' (received)' : '');
			let delivered = '<span uk-icon="icon: arrow-left"></span> ' + ((radiator.outPallet == undefined) ? 'Not sent' : ('Out on pallet ' + radiator.outPallet)) + ((radiator.deliveryTime != '') ? (' (sent on ' + fixDate(radiator.deliveryDate) + ')') : '');
			
			html += '<li data-colour="' + alphanumeric(radiator.colour) + '" data-pallet="' + alphanumeric(radiator.inPallet) + '">';
			html += '<div class="uk-flex uk-flex-middle" uk-grid>';
			html += '<div class="uk-width-expand">';
			html += '<p class="uk-margin-remove">[' + radiator.colour + '] ' + radiator.name + '</p>';
			html += '<p class="uk-text-light uk-text-small uk-margin-remove">' + received + '</p>';
			html += '<p class="uk-text-light uk-text-small uk-margin-remove">' + delivered + '</p>';
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
			getRadiatorComments(radiatorId, getPalletRadiators);
		});
		
	});
}