;(function () {
	var varLookup = {
			Program: [
				'> es.VariableDeclaration > es.VariableDeclarator > es.Identifier.id[name={{name}}]',
				'> es.FunctionDeclaration > es.id[name={{name}}]'
			],
			FunctionDeclaration: [
				'> es.BlockStatement > es.VariableDeclaration > es.VariableDeclarator > es.Identifier.id[name={{name}}]',
				'> es.params_.Identifier[name={{name}}]',
				'> es.id[name={{name}}]'
			],
			FunctionExpression: [
				'> es.BlockStatement > es.VariableDeclaration > es.VariableDeclarator > es.Identifier.id[name={{name}}]',
				'> es.params_.Identifier[name={{name}}]',
			],
			CatchClause: [
				'> es.BlockStatement > es.VariableDeclaration > es.VariableDeclarator > es.Identifier.id[name={{name}}]',
				'> es.param.Identifier[name={{name}}]',
			],
			ForStatement: [
				'> es.init > es.VariableDeclarator > es.Identifier.id[name={{name}}]'
			],
			IfStatement: [],
			WhileStatement: [],
			DoStatement: [],
		},
		cachedVarLookupForHoisted = [
			'> es.BlockStatement > es.VariableDeclaration > es.VariableDeclarator > es.Identifier.id[name={{name}}]',
			'> es.BlockStatement > es.FunctionDeclaration > es.id[name={{name}}]',
		].join(','),
		hoistedBlockTypes = /^(?:For|If|While|Do)Statement$/,
		lookupScope = $.map(varLookup, function(xs, type) { return hoistedBlockTypes.test(type) ? null : 'es.' + type }).join(',').replace(/(^,)|(,,)|(,$)/g, ''),
		scopeTypes = $.map(varLookup, function(xs, type) { return 'es.' + type }).join(','),
		cachedVarLookup = {}

	$.each(varLookup, function(type,xs) {
		cachedVarLookup[type] = xs.join(',')
	})

	function getVar($referenceScope, name, lookup) {
		if (!$referenceScope.length)
			return $()

		var type = $referenceScope.data('type'),
			$var = $referenceScope.find(lookup.replace(/{{name}}/g, name))

		return $var
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

		// Pass 1, identify: .scope, assign data-scope-id
		var globalScopeId = 0
		// TODO: Extract from Pass 2

		// Pass 2, identify: .local-variable, .upper-variable
		$ast.find('es.Identifier').each(function() {
			var $id = $(this)

			if (isObjectKey($id))
				return

			var $referenceScope = $id.closest(scopeTypes),
				scopeType = $referenceScope.data('type'),
				idName = $id.data('name'),
				$var = getVar($referenceScope, idName, cachedVarLookup[scopeType])

			while (!$var.length && hoistedBlockTypes.test(scopeType)) {
				$var = getVar($referenceScope, idName, cachedVarLookupForHoisted)
				if (!$var.length) {
					$referenceScope = $referenceScope.closest('es.BlockStatement').parent()
					scopeType = $referenceScope.data('type')
					if (!hoistedBlockTypes.test(scopeType)) {
						$var = getVar($referenceScope, idName, cachedVarLookup[scopeType])
						break;
					} else if (scopeType === 'ForStatement') {
						$var = getVar($referenceScope, idName, cachedVarLookup[scopeType])
					}
				}
			}

			if ($var.length) {
				// Resolve .local-variable

				var $scope = $var.data('scope')
				if (!$scope) {
					if (scopeType === 'FunctionDeclaration' || hoistedBlockTypes.test(scopeType)) {
						$scope = $referenceScope.parent().closest(lookupScope)
					} else {
						$scope = $referenceScope
					}
					$var.data('scope', $scope.addClass('scope'))
				}
				var scopeId = $scope.attr('data-scope-id')
				if (!scopeId)
					$scope.attr('data-scope-id', scopeId = ++globalScopeId)

				/*
				var varLocator = '[data-scope-id="' + scopeId + '"][name="' + $id.data('name') + '"]'

				if ($scope.find(varLocator).length === 0) {
					$scope.on('click', varLocator, function() {
						$('.highlighted-variable').removeClass('highlighted-variable')
						$scope.find(varLocator).addClass('highlighted-variable')
					})
				}
				*/

				$id
					.addClass('local-variable')
					.attr('data-scope-id', scopeId)

				$var
					.addClass('declared')
					.attr('data-scope-id', scopeId)
					.attr('data-count', ($var.data('count') || 0) + 1)

				if (!$id.is($var)) {
					$id.addClass('reference')
				}
			} else {
				$id.addClass('reference upper-variable')
			}
		})

		// Pass 3, resolve .upper-variable
		$ast.find('.reference.upper-variable').each(function() {
			var $ref = $(this),
				// Start from 2nd closest parent scope (grandfather)
				$scope = $ref.closest('.scope').parent().closest('.scope'),
				name = $ref.data('name')

			for (var $upperVar = $(), varLocator; $scope.length && !$upperVar.length; $scope = $scope.parent().closest('.scope')) {
				varLocator = '.declared[data-scope-id="' + $scope.data('scope-id') + '"][name="' + name + '"]'
				console.log('locator',varLocator)
				$upperVar = $scope.find(varLocator)
			}

			if ($upperVar.length) {
				$ref
					.attr('data-scope-id', $upperVar.data('scope-id'))

				$upperVar
					.attr('data-count', ($upperVar.data('count') || 0) + 1)
			} else {
				$ref
					.addClass('undefined')
					.attr('data-scope-id', 1)
			}
		})
	}

	window.findVariables = findVariables
})()
