
markFunctionCalls = (function() {
	function predicateFor(name) {
		return name === '*' || !name ? '[name]' : '[name=' + name + ']'
	}
	function adjacencyFor(name) {
		return !name ? '' : '>'
	}

	return function($ast, marker, fnames) {
		$.each(fnames, function(_, path) {
			console.log('-----------------')
			console.log(path)
			var dir = path.split('.'),
				fname = dir.pop(),
				calleeObject = dir.pop(),
				calleeObjectSelector,
				$calleeObject

			console.log(calleeObject)
			if (typeof calleeObject !== 'undefined') {
				if (dir.length === 0) {
					calleeObjectSelector = 'es.CallExpression > es.MemberExpression.callee ' + adjacencyFor(calleeObject) + ' es.Identifier.object' + predicateFor(calleeObject)
				} else {
					calleeObjectSelector = []
					$.each(dir, function(_, d) {
						console.log('d',d,adjacencyFor(d))
						calleeObjectSelector.push(adjacencyFor(d) + ' es.MemberExpression.object > es.Identifier.object' + predicateFor(d))
					})
					calleeObjectSelector = 'es.CallExpression > es.MemberExpression.callee ' + calleeObjectSelector.join(' ') + ' ~ es.Identifier.property' + predicateFor(calleeObject)
				}

				console.log(calleeObjectSelector)
				$ast.find(calleeObjectSelector).each(function() {
					$(this)
						.closest('es.CallExpression')
						.find('> es.MemberExpression.callee > es.Identifier.property' + predicateFor(fname))
						.closest('es.CallExpression').addClass(marker)
				})
			} else {
				calleeObjectSelector = 'es.CallExpression > es.Identifier.callee' + predicateFor(fname)
				$ast.find(calleeObjectSelector).each(function() {
					$(this)
						.closest('es.CallExpression').addClass(marker)
				})
			}
		})
	}
})()

function markConsoleCallsForRemoval($ast) {
	markFunctionCalls($ast, 'marked-for-removal', ['window.console.*', 'console.*'])
}

