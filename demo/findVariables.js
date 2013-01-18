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
		blockTypes = $.map(varLookup, function(xs, type) { return 'es.' + type }).join(','),
		cachedVarLookup = {}

	$.each(varLookup, function(type,xs) {
		cachedVarLookup[type] = xs.join(',')
	})

	function getVar($block, name, lookup) {
		if (!$block.length)
			return $()

		var type = $block.data('type'),
			$var = $block.find(lookup.replace(/{{name}}/g, name))

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
		var globalScopeId = 0

		$ast.find('es.Identifier').each(function() {
			var $id = $(this)

			if (isObjectKey($id))
				return

			var $block = $id.closest(blockTypes),
				blockType = $block.data('type'),
				idName = $id.data('name'),
				$var = getVar($block, idName, cachedVarLookup[blockType])

			while (!$var.length && hoistedBlockTypes.test(blockType)) {
				$var = getVar($block, idName, cachedVarLookupForHoisted)
				if (!$var.length) {
					$block = $block.closest('es.BlockStatement').parent()
					blockType = $block.data('type')
					if (!hoistedBlockTypes.test(blockType)) {
						$var = getVar($block, idName, cachedVarLookup[blockType])
						break;
					} else if (blockType === 'ForStatement') {
						$var = getVar($block, idName, cachedVarLookup[blockType])
					}
				}
			}

			if ($var.length) {
				var $scope = $var.data('scope')
				if (!$scope) {
					if (blockType === 'FunctionDeclaration' || hoistedBlockTypes.test(blockType)) {
						// Apparently $block.closest(lookupScope) returns itself if
						// the selector has multiple conditions ('ie: es.FunctionDeclaration, es.Program')
						$scope = $block.parent().closest(lookupScope)
					} else {
						$scope = $block
					}
					$var.data('scope', $scope.addClass('scope'))
				}
				var scopeId = $scope.attr('data-scope-id')
				if (!scopeId)
					$scope.attr('data-scope-id', scopeId = ++globalScopeId)

				var varLocator = '[data-scope-id="' + scopeId + '"][name="' + $id.data('name') + '"]'

				if ($scope.find(varLocator).length === 0) {
					$scope.on('click', varLocator, function() {
						$('.highlighted-variable').removeClass('highlighted-variable')
						$scope.find(varLocator).addClass('highlighted-variable')
					})
				}

				$id
					.addClass('local-variable')
					.attr('data-scope-id', scopeId)

				$var
					.addClass('declared')
					.attr('data-scope-id', scopeId)
					.attr('data-count', ($var.attr('data-count') || 0) + 1)

				if (!$id.is($var)) {
					$id.addClass('reference')
				}
			} else {
				$id.addClass('upper-variable')
			}
		})
	}

	window.findVariables = findVariables
})()
