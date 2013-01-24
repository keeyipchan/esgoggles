;(function () {
	function escapeAttrValue(name) {
		return name.replace('$','\\$');
	}

	function isObjectKey($id) {
		return (
			// object.blah
			$id.closest('es.MemberExpression.computed-false').find('> es.property').is($id)
			|| 
			// { blah: .. }
			$id.closest('es.Property').find('> es.key').is($id)
		)
	}

	function findVariables($ast) {
		var benchmark = new Benchmark()

		// Pass 1, identify: .scope, assign data-scope-id
		var lookupScope = $.map([
			'Program',
			'FunctionDeclaration',
			'FunctionExpression',
			'WithStatement',
			'CatchClause'
		], function(type) { return 'es.' + type }).join(',')
		benchmark.time('pass 1', function() {
			$ast.find(lookupScope).each(function(i) {
				$(this)
					.addClass('scope')
					.attr('data-scope-id', i+1)
					.data('local-variables', {})
			})
		})

		// Pass 2, find variable declarations and params
		var lookupDeclarationsAndParams = [
			'es.VariableDeclarator > es.Identifier',
			'es.Identifier.params_'
		].join(',')
		function setScope($var, isFunctionDeclaration) {
			var $scope = isFunctionDeclaration ? $var.closest('.scope').parent().closest('.scope') : $var.closest('.scope')
			$var
				.addClass('declared local-variable')
				.data('scope', $scope)
				.attr('data-scope-id', $scope.data('scope-id'))
				.attr('data-count', 1)
			$scope.data('local-variables')[$var.data('name')] = $var
			return $var
		}
		benchmark.time('pass 2', function() {
			$ast.find(lookupDeclarationsAndParams).each(function() {
				setScope($(this))
			})
		})

		// Pass 3, find function declarations
		benchmark.time('pass 3', function() {
			$ast.find('es.FunctionDeclaration > es.id').each(function() {
				setScope($(this), true)
			})
		})

		// Pass 4, find references
		function setReference($id, $var) {
			$var.attr('data-count', $var.data('count') + 1)
			$id.attr('data-scope-id', $var.data('scope-id'))
		}
		benchmark.time('pass 4', function() {
			var $list, found
			benchmark.time('lookup', function() {
				$list = $ast.find('es.Identifier:not(.declared)')
			})
			benchmark.time('loop', function() {
				for (var i=0, n=$list.length; i < n; i++) {
					var $id = $($list[i])

					if (isObjectKey($id))
						continue

					$id.addClass('reference')

					var name = $id.data('name'),
						$scope = $id.closest('.scope'),
						$var = $scope.data('local-variables')[name]

					if ($var) {
						$id.addClass('local-variable')
						setReference($id, $var)
					} else {
						found = false
						$id.addClass('upper-variable')
						for (; $scope.length; $scope = $scope.parent().closest('es.scope')) {
							$var = $scope.data('local-variables')[name]
							if ($var) {
								if ($scope.hasClass('Program'))
									$id.addClass('global-variable')
								else
									$id.addClass('shared-variable')
								setReference($id, $var)
								found = true
								break;
							}
						}

						if (!found) {
							$id
								.attr('data-scope-id', 1)
								.addClass('undefined-variable')
						}
					}
				}
			})

			ready()
		})

		function ready() {
			console.log('ready');
			// Pass 5, resolve global assignments
			// TODO: Resolve WithStatements
			benchmark.time('pass 5', function() {
				$ast.find('es.AssignmentExpression > es.left.undefined-variable').each(function() {
					var $id = $(this),
						name = $id.data('name')

					if (!$id.hasClass('undefined-variable'))
						return

				})
			})

			function resolveBuiltins(className, names) {
				var lookup = $.map(names, function(name) { return 'es.undefined-variable[name="' + escapeAttrValue(name) + '"]' }).join(',')
				$ast.find(lookup).removeClass('undefined-variable').addClass(className)
			}

			// TODO: Make this configurable
			// Pass 5, resolve js builtins
			resolveBuiltins('js-builtin', ['Date','Array','Math', 'RegExp'])
			// Pass 6, resolve browser builtins
			resolveBuiltins('browser-builtin', ['window','setInterval', 'setTimeout','alert','console','document', 'history'])

		}

		benchmark.report()
	}

	window.findVariables = findVariables
})()
