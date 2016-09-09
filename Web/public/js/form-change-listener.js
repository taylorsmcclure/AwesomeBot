var initial_form_state;
function saveFormState() {
	initial_form_state = $('#form').serialize();
}

$(window).bind("beforeunload", function(e) {
	var form_state = $("#form").serialize();
	if(initial_form_state!=form_state) {
		var message = "You have unsaved changes on this page. Do you want to leave this page and discard your changes or stay on this page?";
		e.returnValue = message;
		return message;
	}
});