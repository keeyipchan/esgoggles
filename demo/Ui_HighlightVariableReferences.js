function initUi_HighlightVariableReferences($ast) {
	$ast.on('click', 'es.Identifier.reference, es.Identifier.declared', function() {
		var $id = $(this),
			$scope = $id.closest('.scope[data-scope-id="' + $id.data('scope-id') + '"]'),
			varLocator = '[data-scope-id="' + $id.data('scope-id') + '"][name="' + $id.data('name') + '"]'
		$ast.find('.highlighted-identifier').removeClass('highlighted-identifier')
		$scope.find(varLocator).addClass('highlighted-identifier')
	})
}
