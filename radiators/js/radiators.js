let id_radiatorBoard = '5856106281';
let id_radiatorBoardColour = 'text';
let id_radiatorBoardInPallet = 'numbers';
let id_radiatorBoardOutPallet = 'connect_boards';
let id_radiatorBoardOutPalletDispatch = 'mirror3';
let id_radiatorBoardOutPalletDispatchDate = 'mirror';
let id_radiatorBoardOutPalletDispatchTime = 'mirror_1';
let id_radiatorBoardOutReceived = 'checkbox';
let id_radiatorBoardOutStatus = 'formula3';
let id_radiatorBoardRejected = 'check';

let id_palletBoard = '5856109859';
let id_palletBoardRadiators = 'link_to_radiators_2';
let id_palletBoardDelivery = 'connect_boards';
let id_palletBoardDeliveryDate = 'mirror';
let id_palletBoardDeliveryTime = 'mirror3';
let id_palletBoardNumerical = 'numbers';

let id_deliveryBoard = '5856111111';
let id_deliveryBoardPallets = 'link_to_pallets_2';
let id_deliveryBoardDate = 'date';
let id_deliveryBoardTime = 'hour';
let id_deliveryBoardDriver = 'people';
let id_deliveryBoardSignature = 'text';
let id_deliveryBoardRadiators = 'text5';

let fields_radiators = 'id name updates(limit: 50) { body } group { title } column_values { id text ... on BoardRelationValue { display_value linked_item_ids } ... on MirrorValue { display_value } }';
let fields_pallets = 'id name column_values { id text ... on BoardRelationValue { display_value linked_item_ids } ... on MirrorValue { display_value } }';
let fields_deliveries = 'id name column_values { id text ... on BoardRelationValue { display_value linked_item_ids } }';

let workshop = true;

document.addEventListener("DOMContentLoaded", function() {
	if (!workshop) {
		gbc('#workshop-navigation, .workshop-link').delete();
	}
});

let non_radiator_codes = [
	{ id: "feet", codes: ['60682', '36645', '33645', '60680', '117613', '118538'], name: 'Feet', colour: 'default' },
	{ id: "bracket", codes: ['60378', '50802', '50813', '100850', '65846', '93772'], name: 'Bracket', colour: 'default' },
	{ id: "half_tube", codes: ['11354','131154'], name: '½ Tube', colour: 'default' },
	{ id: "full_tube", codes: ['125237'], name: 'Tube', colour: 'default' },
	{ id: "small_oval_middle", codes: ['DRCIOMS500AB','DRCIOMS500AC','DRCIOMS500CB','DRCIOMS500MBK','DRCIOMS500DKP'], name: 'Small Oval Middle', colour: 'warning' },
	{ id: "small_oval_end", codes: ['DRCIOES560AB','DRCIOES560AC','DRCIOES560CB','DRCIOES560MBK','DRCIOES560DKP'], name: 'Small Oval End', colour: 'warning' },
	{ id: "ornate_middle", codes: ['DRCIORMS680AB','DRCIORMS680AC','DRCIORMS680CB','DRCIORMS680MBK','DRCIORMS680DKP'], name: 'Ornate Middle', colour: 'warning' },
	{ id: "ornate_end", codes: ['DRCIORES750AB','DRCIORES750AC','DRCIORES750CB','DRCIORES750MBK','DRCIORES750DKP'], name: 'Ornate End', colour: 'warning' },
	{ id: "large_oval_middle", codes: ['DRCIOMS690AB','DRCIOMS690AC','DRCIOMS690CB','DRCIOMS690MBK','DRCIOMS690DKP'], name: 'Large Oval Middle', colour: 'warning' },
	{ id: "large_oval_end", codes: ['DRCIOES760AB','DRCIOES760AC','DRCIOES760CB','DRCIOES760MBK','DRCIOES760DKP'], name: 'Large Oval End', colour: 'warning' },
	{ id: "half_right_bushes", codes: ['DRCIEDLBAB','DRCIEDLBAC','DRCIEDLBCB','DRCIEDLBMBK','DRCIEDLBDKP'], name: '½ Bushes (R)', colour: 'warning' },
	{ id: "half_left_bushes", codes: ['DRCIEDRBAB','DRCIEDRBAC','DRCIEDRBCB','DRCIEDRBMBK','DRCIEDRBDKP'], name: '½ Bushes (L)', colour: 'warning' },
	{ id: "quarter_right_bushes", codes: ['DRCIED14RBAB','DRCIED14RBAC','DRCIED14RBCB','DRCIED14RBMBK','DRCIED14RBDKP'], name: '¼ Bushes (R)', colour: 'warning' },
	{ id: "quarter_left_bushes", codes: ['DRCIED14LBAB','DRCIED14LBAC','DRCIED14LBCB','DRCIED14LBMBK','DRCIED14LBDKP'], name: '¼ Bushes (L)', colour: 'warning' },
	{ id: "wall_stays", codes: ['DRCIWSAB','DRCIWSAC','DRCIWSCB','DRCIWSMBK','DRCIWSDKP'], name: 'Wall Stays', colour: 'warning' }
];

// ==================================================
// ==================== CLASSES =====================
// ==================================================

class Delivery {
	constructor(delivery) {
		this.id = delivery.id;
		this.name = delivery.name;
		this.date = columnText(delivery, id_deliveryBoardDate);
		this.friendlyDate = fixDate(this.date);
		this.time = columnText(delivery, id_deliveryBoardTime);
		this.driver = columnText(delivery, id_deliveryBoardDriver);
		this.signature = columnText(delivery, id_deliveryBoardSignature);
		this.status = ((this.signature == '') ? 'Un-delivered': 'Delivered');
		this.pallets = linkedColumnText(delivery, id_deliveryBoardPallets);
		this.radiators = columnText(delivery, id_deliveryBoardRadiators);
	}
}

class Deliveries {
	#deliveries = [];
	
	constructor(data) {
		let deliveries = data['data']['boards'][0]['items_page']['items'];
		
		for (var i = 0; i < deliveries.length; i++) {
			let delivery = deliveries[i];
			let newDelivery = new Delivery(delivery);
			this.#deliveries.push(newDelivery);
		}
	}
	
	get deliveredCount() {
		return this.#deliveries.filter(function (el) {
		  return el.status == 'Delivered';
		}).length;
	}
	
	get undeliveredCount() {
		return this.#deliveries.filter(function (el) {
		  return el.status == 'Un-delivered';
		}).length;
	}
	
	get all() {
		this.#deliveries.sort((a, b) => (a.name < b.name) ? 1 : -1).sort((a, b) => (a.date < b.date ) ? 1 : -1);
		return this.#deliveries;
	}
}

class Pallet {
	constructor(pallet) {
		this.id = pallet.id;
		this.name = pallet.name;
		this.deliveryId = linkedColumnValue(pallet, id_palletBoardDelivery);
		this.delivery = linkedColumnText(pallet, id_palletBoardDelivery);
		this.deliveryDate = linkedColumnText(pallet, id_palletBoardDeliveryDate);
		this.deliveryTime = linkedColumnText(pallet, id_palletBoardDeliveryTime);
		this.radiators = linkedColumnValue(pallet, id_palletBoardRadiators);
		this.radiatorCount = this.radiators.length;
		this.radiatorText = (this.radiatorCount + ' radiator' + ((this.radiatorCount != 1) ? 's' : '') );
	}
}

class Pallets {
	#pallets = [];
	
	constructor(data) {
		let pallets = data['data']['boards'][0]['items_page']['items'];
		
		for (var i = 0; i < pallets.length; i++) {
			let pallet = pallets[i];
			let newPallet = new Pallet(pallet);
			this.#pallets.push(newPallet);
		}
	}
	
	get all() {
		this.#pallets.sort((a, b) => (parseInt(a.name) < parseInt(b.name)) ? 1 : -1);
		return this.#pallets;
	}
}

class PalletOfRadiators {
	constructor(palletNumber) {
		this.palletNumber = palletNumber;
		this.radiators = [];
	}
}

class PalletsOfRadiators {
	#palletsOfRadiators = [];
	
	constructor(data) {
		let radiators = data['data']['boards'][0]['groups'][0]['items_page']['items'];
		
		for (var i = 0; i < radiators.length; i++) {
			let radiator = radiators[i];
			let newRadiator = new Radiator(radiator);
			this.addRadiatorToPallet(newRadiator);
		}
	}
	
	addRadiatorToPallet(radiator) {
		let radiatorPalletNumber = radiator.inPallet;
		
		// get the radiator pallet with the passed pallet number
		let existingRadiatorPallet = this.#palletsOfRadiators.find(x => x.palletNumber === radiatorPalletNumber);
		
		// does the pallet number already have a radiator pallet?
		let existingRadiatorPalletExists = !(existingRadiatorPallet == undefined);
		
		if (existingRadiatorPalletExists) {
			existingRadiatorPallet.radiators.push(radiator); // add the radiator to the existing radiator pallet
		} else {
			let newRadiatorPallet = new PalletOfRadiators(radiatorPalletNumber); // create a new radiator pallet
			newRadiatorPallet.radiators.push(radiator); // add the radiator to the new radiator pallet
			this.#palletsOfRadiators.push(newRadiatorPallet); // add the radiator pallet to the 
		}
	}
	
	get all() {
		for (var i = 0; i < this.#palletsOfRadiators.length; i++) { // sort radiators on a pallet of radiators by colour, then name
			this.#palletsOfRadiators[i].radiators.sort((a, b) => ((a.colour + a.name) > (b.colour + b.name)) ? 1 : -1);
		}
		
		// sort pallets of radiators by pallet number
		this.#palletsOfRadiators.sort((a, b) => (a.palletNumber > b.palletNumber) ? 1 : -1);
		return this.#palletsOfRadiators;
	}
}

class PurchaseOrder {
	constructor(purchaseOrder) {
		this.id = purchaseOrder.id;
		this.date = purchaseOrder.title;
		this.friendlyDate = fixDate(purchaseOrder.title);
	}
}

class PurchaseOrders {
	#purchaseOrders = [];
	
	constructor(data) {
		let purchaseOrders = data['data']['boards'][0]['groups'];
		
		for (var i = 0; i < purchaseOrders.length; i++) {
			let purchaseOrder = purchaseOrders[i];
			let newPurchaseOrder = new PurchaseOrder(purchaseOrder);
			this.#purchaseOrders.push(newPurchaseOrder);
		}
	}
	
	get all() {
		this.#purchaseOrders.sort((a, b) => (a.date < b.date) ? 1 : -1);
		return this.#purchaseOrders;
	}
}

class Radiator {
	constructor(radiator) {
		this.id = radiator.id;
		this.name = radiator.name;
		this.colour = camelCase(columnText(radiator, id_radiatorBoardColour));
		this.inPallet = columnText(radiator, id_radiatorBoardInPallet);
		this.received = !(columnText(radiator, id_radiatorBoardOutReceived) == "");
		this.outPalletId = linkedColumnValue(radiator, id_radiatorBoardOutPallet);
		this.deliveryDate = linkedColumnText(radiator, id_radiatorBoardOutPalletDispatchDate);
		this.deliveryTime = linkedColumnText(radiator, id_radiatorBoardOutPalletDispatchTime);
		this.purchaseOrderName = purchaseOrderName(radiator);
		this.friendlyPurchaseOrderName = fixDate(this.purchaseOrderName);
		this.rejected = !(columnText(radiator, id_radiatorBoardRejected) == "");
		this.updates = radiator.updates;
		this.outPallet = linkedColumnText(radiator, id_radiatorBoardOutPallet);
		
		var status = 'Not received';
		var icon = 'home';
		var style = 'uk-text-muted';
		
		if (this.rejected) {
			status = 'Rejected';
			icon = 'close';
			style = 'uk-text-danger';
		} else if ((this.deliveryTime != '') && (this.deliveryTime != undefined)) {
			status = 'Delivered';
			icon = 'check';
			style = 'uk-text-success';
		} else if ((this.outPallet != '') && (this.outPallet != undefined)) {
			status = 'Awaiting delivery';
			icon = 'sign-out';
			style = 'uk-text-warning';
		} else if (this.received) {
			status = 'Received';
			icon = 'sign-in';
			style = 'uk-text-primary';
		}
		
		if (radiator.updates.length > 0) {
			style += ' has-comment';
		}
		
		this.status = status;
		this.icon = icon;
		this.style = style;
		
		this.radiatorType = radiatorType(this.name);
		this.radiatorTypeLabel = ((this.radiatorType != 'radiator') ? ' <span class="uk-label uk-label-' + non_radiator_codes.find(x => x['id'] === this.radiatorType).colour + '">' + non_radiator_codes.find(x => x['id'] === this.radiatorType).name + '</span>' : '');
		
		this.quantity = 1;
		
		if (this.name.split(' x ').length > 1) {
			this.quantity = parseInt(this.name.split(' x ')[0]);
		}
	}
}

function radiatorType(code) {
	var type = 'radiator';
	
	for (var i = 0; i < non_radiator_codes.length; i++) {
		let nonRadiatorType = non_radiator_codes[i];
		
		if (String(code).split(' x ').length > 1) {
			code = String(code).split(' x ')[1];
		}
		
		if (nonRadiatorType.codes.includes(code)) {
			type = nonRadiatorType.id;
		} else if (nonRadiatorType.codes.includes(code)) {
			type = nonRadiatorType.id;
		}
	}
	
	return type;
}

class Radiators {
	#radiators = [];
	
	constructor(data) {
		let radiators = data['data']['boards'][0]['items_page']['items'];
		
		for (var i = 0; i < radiators.length; i++) {
			let radiator = radiators[i];
			let newRadiator = new Radiator(radiator);
			this.#radiators.push(newRadiator);
		}
	}
	
	get all() {
		this.#radiators.sort((a, b) => ((a.purchaseOrderName + a.colour + a.name) > (b.purchaseOrderName + b.colour + b.name)) ? 1 : -1);
		return this.#radiators;
	}
}

class Update {
	constructor(update) {
		this.id = update.id;
		this.body = update.body;
		this.createdBy = update.creator.name;
		this.created = update.created_at;
		this.itemId = update.item_id;
	}
}

class Updates {
	#updates = [];
	
	constructor(data) {
		let updates = data['data']['boards'][0]['updates'];
		
		// hide comments from system development
		let updatesAfter = Date.parse('27 Feb 2024 00:00:00 GMT');
		
		for (var i = 0; i < updates.length; i++) {
			let update = updates[i];
			let created = new Date(update.created_at);
			
			if (created > updatesAfter) {
				let newUpdate = new Update(update);
				this.#updates.push(newUpdate);
			}
		}
	}
	
	get all() {
		this.#updates.sort((a, b) => (a.created < b.created) ? 1 : -1);
		return this.#updates;
	}
}

// ==================================================
// ================ TEXT FUNCTIONS ==================
// ==================================================

function purchaseOrderName(radiator) {
	if (radiator.group == undefined) { return ''; }
	
	return radiator.group.title;
}

// ==================================================
// =============== RADIATOR COMMENTS ================
// ==================================================

function getRadiatorComments(radiatorId, func) {
	let query = ' { boards(ids:' + id_radiatorBoard + ') { items_page(limit: 500, query_params: { ids: [' + radiatorId + ']}) { items { ' + fields_radiators + ' } } } } ';
	
	mondayAPI(query, function(data) {
		let radiators = new Radiators(data);
		
		if (radiators.all.length == 0) {
			displayError('No radiator with ID: ' + radiatorId + ' (getPurchaseOrders)');
			return false;
		}
		
		let radiator = radiators.all[0];
		
		let received = 'Pallet ' + radiator.inPallet + ((radiator.received) ? ' (received)' : '');
		let delivered = ((radiator.outPallet == '') ? 'Not sent' : ('Pallet ' + radiator.outPallet)) + ((radiator.deliveryTime != '') ? (' (sent ' + fixDate(radiator.deliveryDate) + ')') : '');
		
		var html = '';
		
		html += '<button class="uk-modal-close-default" type="button" uk-close></button>';
		html += '<div class="uk-padding uk-child-width-1-1" uk-grid>';
		html += '<div>';
		html += '<h3>' + radiator.name + '</h3>';
		
		html += '<div> <dl class="uk-description-list">';
		html += '<dt>ID</dt>';
		html += '<dd>' + radiator.id + '</dd>';
		html += '<dt>Colour</dt>';
		html += '<dd>' + radiator.colour + '</dd>';
		html += '<dt>Purchase Order</dt>';
		html += '<dd>' + radiator.friendlyPurchaseOrderName + '</dd>';
		html += '<dt>In Pallet</dt>';
		html += '<dd>' + received+ '</dd>';
		html += '<dt>Out Pallet</dt>';
		html += '<dd>' + delivered + '</dd>';
		html += '</dl> </div>';
		
		html += '<ul class="uk-list uk-list-striped uk-width-1-1">';
		
		if (radiator.updates.length > 0) {
			for (var i = 0; i < radiator.updates.length; i++) {
				let update = radiator.updates[i];
				
				html += '<li>' + update.body + '</li>';
			}
		} else {
			html += '<li>No comments</li>';
		}
		
		html += '</ul>';
		html += '</div>';
		
		
		html += '<div> <div class="uk-grid-small" uk-grid>';
		html += '<div class="uk-width-expand"> <button class="uk-button uk-button-primary uk-width-1-1" id="add-comment">Add Comment</button> </div>';
		
		if (workshop) {
			html += '<div class="uk-width-auto"> <button class="uk-button uk-button-' + ((radiator.rejected) ? 'success' : 'danger') + '" id="toggle-reject-radiator">' + ((radiator.rejected) ? 'Accept' : 'Reject') + '</button> </div>';
		}
		
		html += '</div> </div>';
		html += '</div>';
		
		UIkit.modal.dialog(html);
		
		gbc('#add-comment').on('click', function(e) {
			addRadiatorComment(radiatorId, func);
		});
		
		gbc('#toggle-reject-radiator').on('click', function(e) {
			if (radiator.rejected) {
				acceptRadiator(radiatorId, func);
			} else {
				rejectRadiator(radiatorId, func);
			}
		});
	});
}

function addRadiatorComment(radiatorId, func) {
	UIkit.modal.prompt('Comment:').then(function(update) {
		if (update != null) {
			let query = 'mutation { create_update (item_id: ' + radiatorId + ', body: "<p>' + userName + ': ' + update + '</p>") { id } }';
			
			mondayAPI(query, function(data) {
				UIkit.notification('Comment added', 'success');
				
				setTimeout(function() {
					func();
				}, 100);
			});
		} else {
			UIkit.notification('No comment added', 'warning');
		}
	});
}

function rejectRadiator(radiatorId, func) {
	UIkit.modal.prompt('Reason radiator is rejected:').then(function(update) {
		if (update != null) {
			let query = 'mutation { create_update (item_id: ' + radiatorId + ', body: "<p>' + userName + ' rejected because ' + update + '</p>") { id } }';
			
			mondayAPI(query, function(data) {
				let radiatorColumnJson = JSON.stringify(' { "' + id_radiatorBoardRejected + '" : { "checked" : "true" } } ');
				let query2 = ' mutation { change_multiple_column_values(item_id: ' + radiatorId + ', board_id: ' + id_radiatorBoard + ', column_values: ' + radiatorColumnJson + ') { id } } ';
				
				mondayAPI(query2, function(data) {
					UIkit.notification('Radiator rejected', 'success');
					
					setTimeout(function() {
						func();
					}, 100);
				});
			});
		} else {
			UIkit.notification('Radiator not rejected', 'warning');
		}
	});
}

function acceptRadiator(radiatorId, func) {
	UIkit.modal.confirm('Are you sure you want to remove the rejection from this radiator?').then(function() {
		let query = 'mutation { create_update (item_id: ' + radiatorId + ', body: "<p>' + userName + ' approved</p>") { id } }';
		
		mondayAPI(query, function(data) {
			let radiatorColumnJson = JSON.stringify(' { "' + id_radiatorBoardRejected + '" : null } ');
			let query2 = ' mutation { change_multiple_column_values(item_id: ' + radiatorId + ', board_id: ' + id_radiatorBoard + ', column_values: ' + radiatorColumnJson + ') { id } } ';
			
			mondayAPI(query2, function(data) {
				UIkit.notification('Radiator is no longer rejected', 'success');
				
				setTimeout(function() {
					func();
				}, 100);
			});
		});
	}, function () {
		UIkit.notification('Radiator remains rejected', 'warning');
	});
}