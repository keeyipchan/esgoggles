// http://stackoverflow.com/a/3171348
(function ($) {
	$.unselect = function() {
		var sel = window.getSelection ? window.getSelection() : document.selection;
		if (sel) {
			if (sel.removeAllRanges) {
				sel.removeAllRanges();
			} else if (sel.empty) {
				sel.empty();
			}
		}
	}
})(jQuery);

