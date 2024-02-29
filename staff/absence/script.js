getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getStaff();
});

let id_staffBoard = '112651059';
let id_staffBoardManager = 'people78';
let id_staffBoardStaff = 'people7';
let id_staffBoardLeave = 'link_to_staff_leave';
let id_staffBoardAbsence = 'board_relation';

let id_staffAbsenceBoard = '5881897546';
let id_staffAbsenceBoardDate = 'date4';
let id_staffAbsenceBoardReason = 'status5';
let id_staffAbsenceBoardStaff = 'connect_boards2';

var membersOfStaff = [];

function getStaff() {
	let query = ' {  boards(ids: [' + id_staffBoard + ']) { items_page( limit: 500, query_params: { rules: [ {column_id: "' + id_staffBoardManager + '", compare_value: ["person-' + userId + '"], operator:any_of }, { column_id: "' + id_staffBoardStaff + '",compare_value: ["person-' + userId + '"], operator: any_of } ],operator:or } ) { items { id name column_values(ids: ["' + id_staffBoardAbsence + '"]) { id ... on BoardRelationValue { linked_item_ids } } } } } } ';
	
	console.log(query);
	
	var absenceIds = [];
	
	mondayAPI(query, function(data) {
		let membersOfStaff = data['data']['boards'][0]['items_page']['items'];
		
		for (var i = 0; i < membersOfStaff.length; i++) {
			let memberOfStaff = membersOfStaff[i];
			
			let absence = linkedColumnValue(memberOfStaff, id_staffBoardAbsence);
			
			if (absence.length > 0) { absenceIds.push(absence); }
		}
		
		getAbsence(absenceIds);
	});
}

function getAbsence(absenceIds) {
	if (absenceIds.length != 0) {
		let query = ' { boards(ids:[' + id_staffAbsenceBoard + ']) { items_page( limit:500, query_params: {ids: [' + absenceIds + '] } ) { items { id name column_values( ids: ["' + id_staffAbsenceBoardDate + '", "' + id_staffAbsenceBoardReason + '", "' + id_staffAbsenceBoardStaff + '"] ) { id text ... on BoardRelationValue { display_value } } } } } } ';
		
		mondayAPI(query, function(data) {
			let daysOff = new DaysOff(data);
			
			let today = new Date(new Date().toDateString());
			var html = '<ul class="uk-list uk-list-divider staff-leave">';
			
			for (var i = 0; i < daysOff.all.length; i++) {
				let dayOff = daysOff.all[i];
				
				html += '<li data-member-of-staff="' + dayOff.memberOfStaff + '">' + dayOff.friendlyDate + ': ' + dayOff.memberOfStaff + ' (' + dayOff.reason + ')</li>';
			}
			
			html += '</ul>';
			
			gbc('#page').show().html(html);
			
			var summaryHtml = '';
			
			if (daysOff.membersOfStaffDaysOff.length > 1) {
				summaryHtml += '<option value="">All Staff</option>';
			}
			
			for (var i = 0; i < daysOff.membersOfStaffDaysOff.length; i++) {
				let memberOfStaffDaysOff = daysOff.membersOfStaffDaysOff[i];
				
				let daysAbsent = (memberOfStaffDaysOff.absence + ' day' + ((memberOfStaffDaysOff.absence == 1) ? '' : 's') + ' absent');
				
				summaryHtml += '<option value="' + memberOfStaffDaysOff.memberOfStaff + '">' + memberOfStaffDaysOff.memberOfStaff + ' (' + daysAbsent + ')</option>';
			}
			
			gbc('#staff').html(summaryHtml).on('change', function(e) {
				let selectedMemberOfStaff = gbc('#staff').val();
				
				gbc('#page .staff-leave li').show();
				
				if (selectedMemberOfStaff != '') {
					gbc('#page .staff-leave li').hide();
					gbc('#page .staff-leave li[data-member-of-staff="' + selectedMemberOfStaff + '"]').show();
				}
			});
		});
	} else {
		gbc('#staff').html('<option>No absences by you and/or your team.</option>');
	}
}

class DaysOff {
	#absenceDays = [];
	
	constructor(data) {
		let absence = data['data']['boards'][0]['items_page']['items'];
		
		for (var i = 0; i < absence.length; i++) {
			let absenceDay = absence[i];
			let newAbsenceDay = new Absence(absenceDay);
			this.#absenceDays.push(newAbsenceDay);
		}
	}
	
	get all() {
		this.#absenceDays.sort((a, b) => (a.date > b.date) ? 1 : -1);
		return this.#absenceDays;
	}
	
	get membersOfStaffDaysOff() {
		var absenceSummary = [];
		
		for (var i = 0; i < this.#absenceDays.length; i++) {
			let dayOff = this.#absenceDays[i];
			
			var existingMemberOfStaff = absenceSummary.find(x => x.memberOfStaff === dayOff.memberOfStaff);
			
			if (existingMemberOfStaff == undefined) {
				existingMemberOfStaff = { memberOfStaff: dayOff.memberOfStaff, absence: 0 };
				absenceSummary.push(existingMemberOfStaff);
			}
			
			existingMemberOfStaff.absence += 1;
		}
		
		absenceSummary.sort((a, b) => (a.memberOfStaff > b.memberOfStaff) ? 1 : -1);
		return absenceSummary;
	}
}

class Absence {
	constructor(absence) {
		this.id = absence.id;
		this.reason = columnText(absence, id_staffAbsenceBoardReason);
		this.memberOfStaff = linkedColumnText(absence, id_staffAbsenceBoardStaff);
		this.date = new Date(new Date(columnText(absence, id_staffAbsenceBoardDate)).toDateString());
		this.friendlyDate = fixDate(columnText(absence, id_staffAbsenceBoardDate));
	}
}