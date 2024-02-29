getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getStaff();
});

let id_staffBoard = '112651059';
let id_staffBoardManager = 'people78';
let id_staffBoardStaff = 'people7';
let id_staffBoardLeave = 'link_to_staff_leave';
let id_staffBoardAbsence = 'board_relation';

let id_staffLeaveBoard = '6153099859';
let id_staffLeaveBoardDate = 'date4';
let id_staffLeaveBoardStaff = 'connect_boards';

var membersOfStaff = [];

function getStaff() {
	let query = ' {  boards(ids: [' + id_staffBoard + ']) { items_page( limit: 500, query_params: { rules: [ {column_id: "' + id_staffBoardManager + '", compare_value: ["person-' + userId + '"], operator:any_of }, { column_id: "' + id_staffBoardStaff + '",compare_value: ["person-' + userId + '"], operator: any_of } ],operator:or } ) { items { id name column_values(ids: ["' + id_staffBoardLeave + '"]) { id ... on BoardRelationValue { linked_item_ids } } } } } } ';
	
	var leaveIds = [];
	
	mondayAPI(query, function(data) {
		let membersOfStaff = data['data']['boards'][0]['items_page']['items'];
		
		for (var i = 0; i < membersOfStaff.length; i++) {
			let memberOfStaff = membersOfStaff[i];
			
			let leave = linkedColumnValue(memberOfStaff, id_staffBoardLeave);
			
			if (leave.length > 0) { leaveIds.push(leave); }
		}
		
		getLeave(leaveIds);
	});
}

function getLeave(leaveIds) {
	if (leaveIds.length != 0) {
		let query = ' { boards(ids:[' + id_staffLeaveBoard + ']) { items_page( limit:500, query_params: {ids: [' + leaveIds + '] } ) { items { id name column_values( ids: ["' + id_staffLeaveBoardDate + '", "' + id_staffLeaveBoardStaff + '"] ) { id text ... on BoardRelationValue { display_value } } } } } } ';
		
		mondayAPI(query, function(data) {
			let daysOff = new DaysOff(data);
			
			let today = new Date(new Date().toDateString());
			var pastHtml = '';
			var todayHtml = '';
			var futureHtml = '';
			
			for (var i = 0; i < daysOff.all.length; i++) {
				let dayOff = daysOff.all[i];
				
				if (today > dayOff.date) {
					pastHtml += '<li data-member-of-staff="' + dayOff.memberOfStaff + '">' + dayOff.friendlyDate + ' (' + humanized_time_span(dayOff.date) + '): ' + dayOff.memberOfStaff + '</li>';
				} else if (today.toDateString() == dayOff.date.toDateString()) {
					todayHtml += '<li data-member-of-staff="' + dayOff.memberOfStaff + '" class="uk-text-warning">TODAY: ' + dayOff.memberOfStaff + '</li>';
				} else {
					futureHtml += '<li data-member-of-staff="' + dayOff.memberOfStaff + '">' + dayOff.friendlyDate + ' (' + humanized_time_span(dayOff.date) + '): ' + dayOff.memberOfStaff + '</li>';
				}
			}
			
			var summaryHtml = '';
			
			if (daysOff.membersOfStaffDaysOff.length > 1) {
				summaryHtml += '<option value="">All Staff</option>';
			}
			
			for (var i = 0; i < daysOff.membersOfStaffDaysOff.length; i++) {
				let memberOfStaffDaysOff = daysOff.membersOfStaffDaysOff[i];
				
				let daysLeave = (memberOfStaffDaysOff.leave + ' day' + ((memberOfStaffDaysOff.leave == 1) ? '' : 's') + ' leave');
				
				summaryHtml += '<option value="' + memberOfStaffDaysOff.memberOfStaff + '">' + memberOfStaffDaysOff.memberOfStaff + ' (' + daysLeave + ')</option>';
			}
			
			gbc('#staff').html(summaryHtml).on('change', function(e) {
				let selectedMemberOfStaff = gbc('#staff').val();
				
				gbc('#page .staff-leave li').show();
				
				if (selectedMemberOfStaff != '') {
					gbc('#page .staff-leave li').hide();
					gbc('#page .staff-leave li[data-member-of-staff="' + selectedMemberOfStaff + '"]').show();
				}
			});
			
			var html = '';
			
			if (pastHtml != '') {
				html += '<ul uk-accordion><li><a class="uk-accordion-title" href>Leave Taken</a><div class="uk-accordion-content"><ul class="uk-list uk-list-divider staff-leave">';
				html += pastHtml;
				html += '</ul></div></li></ul>';
			}
			
			html += '<h4>Upcoming Leave</h4><ul class="uk-list uk-list-divider uk-margin-small-top staff-leave">';
			html += todayHtml;
			html += futureHtml;
			html += '</ul>';
			
			gbc('#page').show().html(html);
		});
	} else {
		gbc('#staff').html('<option>No days annual leave have been taken by you and/or your team.</option>');
	}
}

class DaysOff {
	#leaveDays = [];
	
	constructor(data) {
		let leave = data['data']['boards'][0]['items_page']['items'];
		
		for (var i = 0; i < leave.length; i++) {
			let leaveDay = leave[i];
			let newLeaveDay = new Leave(leaveDay);
			this.#leaveDays.push(newLeaveDay);
		}
	}
	
	get all() {
		this.#leaveDays.sort((a, b) => (a.date > b.date) ? 1 : -1);
		return this.#leaveDays;
	}
	
	get membersOfStaffDaysOff() {
		var leaveSummary = [];
		
		for (var i = 0; i < this.#leaveDays.length; i++) {
			let dayOff = this.#leaveDays[i];
			
			var existingMemberOfStaffDaysOff = leaveSummary.find(x => x.memberOfStaff === dayOff.memberOfStaff);
			
			if (existingMemberOfStaffDaysOff == undefined) {
				existingMemberOfStaffDaysOff = { memberOfStaff: dayOff.memberOfStaff, leave: 0 };
				leaveSummary.push(existingMemberOfStaffDaysOff);
			}
			
			existingMemberOfStaffDaysOff.leave += 1;
		}
		
		leaveSummary.sort((a, b) => (a.memberOfStaff > b.memberOfStaff) ? 1 : -1);
		return leaveSummary;
	}
}

class Leave {
	constructor(leave) {
		this.id = leave.id;
		this.memberOfStaff = linkedColumnText(leave, id_staffLeaveBoardStaff);
		this.date = new Date(new Date(columnText(leave, id_staffLeaveBoardDate)).toDateString());
		this.friendlyDate = fixDate(columnText(leave, id_staffLeaveBoardDate));
	}
}