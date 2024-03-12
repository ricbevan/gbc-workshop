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
	
	let query = ' { boards(ids:[' + id_radiatorBoard + ']) { groups(ids:["' + purchaseOrderId + '"]) { items_page(limit:500) { items { ' + fields_radiators + ' } } } } } ';
	
	mondayAPI(query, function(data) {
		let palletsOfRadiators = new PalletsOfRadiators(data);
		let colourCount = new ColourTypeQuantities(palletsOfRadiators);
		
		var html = '';
		
		for (var i = 0; i < palletsOfRadiators.all.length; i++) {
			let palletOfRadiators = palletsOfRadiators.all[i];
			
			html += '<div>';
			html += '<h3> <label> <input class="uk-checkbox" type="checkbox" id="pallet' + palletOfRadiators.palletNumber + '"> ' + palletOfRadiators.palletNumber + '</label> </h3>';
			html += '<ul class="uk-list uk-list-striped">';
			
			for (var j = 0; j < palletOfRadiators.radiators.length; j++) {
				let radiator = palletOfRadiators.radiators[j];
				
				let checked = (radiator.received ? ' checked' : '');
				let disabled = (((radiator.outPallet == '') || (radiator.outPallet == undefined)) ? '' : ' disabled uk-tooltip="Radiator on pallet ' + radiator.outPallet  + '"');
				
				html += '<li class="uk-flex uk-flex-middle"> <label class="uk-flex-1 uk-flex uk-flex-middle">';
				html += '<input class="uk-checkbox uk-margin-small-right" type="checkbox" id="' + radiator.id + '" data-changed="false"' + checked + disabled + '><span class="uk-margin-small-right">[' + radiator.colour + '] ' + radiator.name + '</span>' + radiator.radiatorTypeLabel;
				html += '</label> <span uk-icon="' + radiator.icon + '" uk-tooltip="' + radiator.status + '" id="' + radiator.id + '" class="radiator-info ' + radiator.style + '"></span> </li>';
			}
			
			html += '</ul>';
			html += '</div>';
		}
		
		html += '<div><button class="uk-button uk-button-primary uk-width-1-1" id="goods-in-save">Save</button></div>';
		
		var colourHtml = '';
		colourHtml += ' <div> <ul class="uk-card-secondary uk-padding" uk-accordion> <li> ';
		colourHtml += ' <a class="uk-accordion-title" href>';
		colourHtml += colourCount.totalHtml;
		colourHtml += ' </a> <div class="uk-accordion-content"> ';
		colourHtml += ' <ul class="uk-list uk-list-divider uk-width-1-1" id="radiator-list"> ';
		colourHtml += colourCount.allHtml;
		colourHtml += ' </ul> ';
		colourHtml += ' </div> </li> </ul> </div> ';
		
		gbc('#page').html(colourHtml + html).show();
		
		gbc('.radiator-info').on('click', function(e) {
			let radiatorId = e.target.closest('span').id;
			getRadiatorComments(radiatorId, getPurchaseOrderRadiators);
		});
		
		gbc('#goods-in-save').on('click', function(e) {
			saveRadiators();
		});
		
		gbc('#page h3 input').on('change', function(e) {
			selectAllOnPallet(this);
		});
		
		gbc('#page ul input[type="checkbox"]').on('click', function(e) {
			e.target.dataset.changed = "true";
		});
	});
}

class ColourTypeQuantities {
	#colourTypeQuantities = [];
	#totalQuantities = new ColourTypeQuantity('Total');
	
	constructor(palletsOfRadiators) {
		for (var i = 0; i < palletsOfRadiators.all.length; i++) {
			let palletOfRadiators = palletsOfRadiators.all[i];
			
			for (var j = 0; j < palletOfRadiators.radiators.length; j++) {
				let radiator = palletOfRadiators.radiators[j];
				
				let existingColour = this.#colourTypeQuantities.find(x => x.colour === radiator.colour);
				let existingColourExists = !(existingColour == undefined);
				
				this.#totalQuantities[radiator.radiatorType] += radiator.quantity;
				
				if (existingColourExists) {
					existingColour[radiator.radiatorType] += radiator.quantity;
				} else {
					let newQuantity = new ColourTypeQuantity(radiator.colour);
					newQuantity[radiator.radiatorType] += radiator.quantity;
					this.#colourTypeQuantities.push(newQuantity);
				}
			}
		}
	}
	
	get allHtml() {
		var html = '';
		
		for (var i = 0; i < this.#colourTypeQuantities.length; i++) {
			let quantity = this.#colourTypeQuantities[i];
			
			html += '<li>';
			html += this.#quantityHtml(quantity);
			html += '</li>';
		}
		
		return html;
	}
	
	get totalHtml() {
		var html = '';
		html += this.#quantityHtml(this.#totalQuantities);
		return html;
	}
	
	#quantityHtml(quantity) {
		var html = '';
		html += quantity.colour;
		
		var nonRadiatorCountHtml2 = [];
		
		for (const [key, value] of Object.entries(quantity)) {
			if (key != 'colour') {
				if (value > 0) {
					nonRadiatorCountHtml2.push(value + ' x ' + camelCase(key.replaceAll('_', ' ')) + (((value == 1) || (key == 'feet')) ? '' : 's'));
				}
			}
		}
		
		if (nonRadiatorCountHtml2.length > 0) {
			html += ' (' + nonRadiatorCountHtml2.join(', ') + ')';
		}
		
		return html;
	}
}

class ColourTypeQuantity {
	constructor(colour) {
		this.colour = colour;
		this.radiator = 0;
		this.feet = 0;
		this.bracket = 0;
		this.half_tube = 0;
		this.full_tube = 0;
		this.small_oval_middle = 0;
		this.small_oval_end = 0;
		this.ornate_middle = 0;
		this.ornate_end = 0;
		this.large_oval_middle = 0;
		this.large_oval_end = 0;
		this.half_right_bushes = 0;
		this.half_left_bushes = 0;
		this.quarter_right_bushes = 0;
		this.quarter_left_bushes = 0;
		this.wall_stays = 0;
	}
}

function selectAllOnPallet(pallet) {
	let palletCheckboxes = pallet.parentElement.parentElement.parentElement.querySelectorAll('ul input[type=checkbox]');
	let selectAllCheckbox = document.querySelectorAll('#' + pallet.id)[0].checked;
	
	for (var i = 0; i < palletCheckboxes.length; i++) {
		let palletCheckbox = palletCheckboxes[i];
		
		if (!palletCheckbox.disabled) {
			palletCheckbox.checked = selectAllCheckbox;
			palletCheckbox.dataset.changed = "true";
		}
	}
}

function saveRadiators() {
	
	var query = ' mutation { ';
	
	gbc('#page ul input[type=checkbox][data-changed="true"]').each(function(radiator) {
		let radiatorId = radiator.id;
		let radiatorChecked = radiator.checked;
		
		let radiatorColumnJson = JSON.stringify(' { "' + id_radiatorBoardOutReceived + '" : ' + (radiatorChecked ? '{ "checked" : "true" }' : 'null') + ' } ');
		
		query += ' update' + radiatorId + ': change_multiple_column_values(item_id: ' + radiatorId + ', board_id: ' + id_radiatorBoard + ', column_values: ' + radiatorColumnJson + ') { id }';
	});
	
	query += ' } ';
	
	mondayAPI(query, function(data) {
		UIkit.notification('Radiators saved', 'success');
	});
	
}