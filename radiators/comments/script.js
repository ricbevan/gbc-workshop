getStarted();

document.addEventListener("DOMContentLoaded", function() {
	getComments();
});

function getComments() {
	let query = ' query { boards(ids:' + id_radiatorBoard + ') { updates (limit: 100) { body id created_at creator { name } item_id } } } ';
	
	mondayAPI(query, function(data) {
		let updates = new Updates(data);
		
		var html = '';
		
		if (updates.all.length == 0) {
			html += '<li>No comments.</li>';
		}
		
		for (var i = 0; i < updates.all.length; i++) {
			let update = updates.all[i];
			
			html += '<div>';
			html += '<div class="uk-card uk-card-default">';
			html += '<div class="uk-card-header">';
			html += '<h3 class="uk-card-title uk-margin-remove-bottom">' + update.createdBy + '</h3>';
			html += '<p class="uk-text-meta uk-margin-remove-top">' + humanized_time_span(update.created) + '</p>';
			html += '</div>';
			html += '<div class="uk-card-body">';
			html += update.body;
			html += '</div>';
			html += '<div class="uk-card-footer">';
			html += '<a href="#" class="uk-link-reset uk-text-uppercase uk-text-meta open-radiator" data-radiator-id="' + update.itemId + '">Open Radiator</a>';
			html += '</div>';
			html += '</div>';
			html += '</div>';
		}
		
		gbc('#page').html(html);
		
		gbc('.open-radiator').on('click', function(e) {
			let radiatorId = e.target.closest('a').getAttribute('data-radiator-id');
			getRadiatorComments(radiatorId, getComments);
		});
	});
}