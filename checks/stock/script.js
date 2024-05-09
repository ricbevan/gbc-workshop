getStarted();

let id_StockCheckBoard = '4159553073';
let id_StockCheckBoardChunalLocation = 'status9';
let id_StockCheckBoardChunalQuantity = 'numbers';
let id_StockCheckBoardSurreyLocation = 'color__1';
let id_StockCheckBoardSurreyQuantity = 'numbers2';

document.addEventListener("DOMContentLoaded", function() {
	getSites();
});

function getSites() {
	var html = '<option value="" disabled hidden selected>site</option>';
	html += '<option value="chunal">Chunal</option>';
	html += '<option value="surrey">Surrey</option>';
	
	gbc('#check-site').html(html).on('change', function(e) {
		let selectedSite = gbc('#check-site').val();
		setLocalStorage('last-selected-stock-site', selectedSite);
		getSiteStock();
	});
	
	if (getLocalStorage('last-selected-stock-site') != null) {
		gbc('#check-site').val(getLocalStorage('last-selected-stock-site'));
		getSiteStock();
	}
}

function getSiteStock() {
	let site = getLocalStorage('last-selected-stock-site');
	
	let query = ' { boards (ids: [' + id_StockCheckBoard + ']) { items_page(limit:500) { items { id name column_values(ids: ["' + id_StockCheckBoardChunalLocation + '", "' + id_StockCheckBoardChunalQuantity + '", "' + id_StockCheckBoardSurreyQuantity + '", "' + id_StockCheckBoardSurreyLocation + '"]) { id text } } } } } ';
	
	mondayAPI(query, function(data) {
		let stockItems = new LocationsOfItems(data, site);
		
		if (stockItems.all.length == 0) {
			UIkit.notification('No stock items available for this day, please speak to the office', 'danger');
			return false;
		}
		
		var html = '<div>';
		
		for (var i = 0; i < stockItems.all.length; i++) {
			let locationOfItems = stockItems.all[i];
			
			html += '<div class="uk-margin-medium-top">';
			html += '<h3>' + locationOfItems.location + '</h3>';
			html += '<div class="uk-child-width-1-1 uk-grid-small uk-form-horizontal" uk-grid>';
			
			for (var j = 0; j < locationOfItems.stockItems.length; j++) {
				let itemOfStock = locationOfItems.stockItems[j];
				
				html += '<div>';
				html += '<label class="uk-form-label" for="' + itemOfStock.id + '">' + itemOfStock.name + '</label>';
				html += '<div class="uk-form-controls"> <input class="uk-input" id="' + itemOfStock.id + '" type="number" placeholder="0" data-changed="false" step="1" value="' + itemOfStock.quantity + '"> </div>';
				html += '</div>';
			}
			
			html += '</div>';
			html += '</div>';
		}
		
		html += '<div class="uk-margin-small-top"><button class="uk-button uk-button-primary uk-width-1-1" id="stock-save">Save</button></div>';
		html += '</div>';
		
		gbc('#page').html(html);
		
		gbc('#stock-save').on('click', function(e) {
			saveStock();
		});
		
		gbc('#page input[type="number"]').on('change', function(e) {
			e.target.dataset.changed = "true";
		});
	});
}

function saveStock() {
	let alteredValues = gbc('input[type=number][data-changed="true"]');
	
	if (alteredValues.count() > 0) {
		var query = ' mutation { ';
		
		alteredValues.each(function(e) {
			let stockId = e.id;
			var stockValue = e.value;
			
			stockValue = (stockValue ? stockValue : 0);
			
			let quantityColumn = (gbc('#check-site').val() == 'surrey' ? id_StockCheckBoardSurreyQuantity : id_StockCheckBoardChunalQuantity);
			
			query += ' update' + e.id + ': change_simple_column_value (item_id: ' + stockId + ', board_id: ' + id_StockCheckBoard + ', column_id: "' + quantityColumn + '", value: "' + stockValue + '") { id }';
		});
		
		query += ' } ';
		
		mondayAPI(query, function(data) {
			UIkit.notification('Stock updated', 'success');
		});
	} else {
		UIkit.notification('Nothing has been changed', 'warning');
	}
}

class StockItem {
	constructor(id, name, location, quantity) {
		this.id = id;
		this.name = name;
		this.location = location;
		this.quantity = quantity;
	}
}

class LocationOfItems {
	constructor(location) {
		this.location = location;
		this.stockItems = [];
	}
}

class LocationsOfItems {
	#locationsOfItems = [];
	
	constructor(data, site) {
		let stockItems = data['data']['boards'][0]['items_page']['items'];
		
		for (var i = 0; i < stockItems.length; i++) {
			let stockItem = stockItems[i];
			this.addStockItemToLocation(stockItem, site);
		}
	}
	
	addStockItemToLocation(stockItem, site) {
		var location = columnText(stockItem, id_StockCheckBoardChunalLocation);
		var quantity = columnText(stockItem, id_StockCheckBoardChunalQuantity);
		
		if (site == 'surrey') {
			location = columnText(stockItem, id_StockCheckBoardSurreyLocation);
			quantity = columnText(stockItem, id_StockCheckBoardSurreyQuantity);
		}
		
		if (quantity != '') {
			let stockItem2 = new StockItem(stockItem.id, stockItem.name, location, quantity);
			
			// get the location with the passed location
			let existingLocationOfItem = this.#locationsOfItems.find(x => x.location === location);
			
			// does the location already have a location of items
			let existingLocationOfItemExists = !(existingLocationOfItem == undefined);
			
			if (existingLocationOfItemExists) {
				existingLocationOfItem.stockItems.push(stockItem2); // add the location to the locations of items
			} else {
				let newLocationOfItems = new LocationOfItems(location); // create a new radiator pallet
				newLocationOfItems.stockItems.push(stockItem2); // add the radiator to the new radiator pallet
				this.#locationsOfItems.push(newLocationOfItems); // add the radiator pallet to the 
			}
		}
	}
	
	get all() {
		for (var i = 0; i < this.#locationsOfItems.length; i++) { // sort radiators on a pallet of radiators by colour, then name
			this.#locationsOfItems[i].stockItems.sort((a, b) => (a.name > b.name) ? 1 : -1);
		}
		
		// sort pallets of radiators by pallet number
		this.#locationsOfItems.sort((a, b) => (a.location > b.location) ? 1 : -1);
		return this.#locationsOfItems;
	}
}