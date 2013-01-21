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

	function getVar($idBlock, name, lookup) {
		if (!$idBlock.length)
			return $()

		var type = $idBlock.data('type'),
			$var = $idBlock.find(lookup.replace(/{{name}}/g, name))

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
		$ast.find(lookupScope).each(function(i) {
			$(this)
				.addClass('scope')
				.attr('data-scope-id', i+1)
		})

		// Pass 2, identify: .local-variable, .upper-variable
		$ast.find('es.Identifier').each(function() {
			var $id = $(this)

			if (isObjectKey($id))
				return

			var $idBlock = $id.closest(blockTypes),
				idBlockType = $idBlock.data('type'),
				name = $id.data('name'),
				$var = getVar($idBlock, name, cachedVarLookup[idBlockType])

			while (!$var.length && hoistedBlockTypes.test(idBlockType)) {
				$var = getVar($idBlock, name, cachedVarLookupForHoisted)
				if (!$var.length) {
					$idBlock = $idBlock.closest('es.BlockStatement').parent()
					idBlockType = $idBlock.data('type')
					if (!hoistedBlockTypes.test(idBlockType)) {
						$var = getVar($idBlock, name, cachedVarLookup[idBlockType])
						break;
					} else if (idBlockType === 'ForStatement') {
						$var = getVar($idBlock, name, cachedVarLookup[idBlockType])
					}
				}
			}

			if ($var.length) {
				// Resolve .local-variable

				var $scope = $var.data('scope'),
					scopeId
				if (!$scope) {
					$scope = $var.closest('es.scope')
					if ($scope.data('type') === 'FunctionDeclaration' && $scope.find('> es.id').is($var))
						$scope = $var.closest('es.scope').parent().closest('es.scope')
					$var.data('scope', $scope)
				}
				scopeId = $scope.data('scope-id')

				$id
					.attr('data-scope-id', scopeId)
					.addClass(scopeId === 1 ? 'global-variable' : 'local-variable')

				$var
					.addClass('declared')
					.attr('data-scope-id', scopeId)
					.attr('data-count', ($var.data('count') || 0) + 1)
					.attr('title', 'Local: ' + $var.data('count') + ' references')

				if (!$id.is($var)) {
					$id
						.addClass('reference')
				}
			} else {
				$id.addClass('reference upper-variable')
			}
		})

		// Pass 3, resolve .upper-variable
		$ast.find('.reference.upper-variable').each(function() {
			var $id = $(this),
				// Start from 2nd closest parent scope (grandfather)
				$scope = $id.closest('.scope').parent().closest('.scope'),
				name = $id.data('name')

			for (var $upperVar = $(), varLocator; $scope.length && !$upperVar.length; $scope = $scope.parent().closest('.scope')) {
				varLocator = '.declared[data-scope-id="' + $scope.data('scope-id') + '"][name="' + name + '"]'
				$upperVar = $scope.find(varLocator)
			}

			if ($upperVar.length) {
				var scopeId = $upperVar.data('scope-id')
				$id
					.attr('data-scope-id', scopeId)

				if (scopeId === 1)
					$id.addClass('global-variable')
				else
					$id.addClass('shared-variable')

				$upperVar
					.attr('data-count', $upperVar.data('count') + 1)
					.attr('title', (scopeId === 1 ? 'Global: ' : 'Shared: ') + $upperVar.data('count') + ' references')
			} else {
				$id
					.addClass('undefined-variable global-variable')
					.attr('data-scope-id', 1)
			}
		})

		// Pass 4, resolve global assignments
		// TODO: Resolve WithStatements
		$ast.find('es.AssignmentExpression > es.left.undefined-variable').each(function() {
			var $id = $(this),
				name = $id.data('name')

			if (!$id.hasClass('undefined-variable'))
				return

			var $references = $ast.find('es.undefined-variable[data-scope-id="1"][name="' + name + '"]')
				.removeClass('undefined-variable')
		})

		// Pass 5, resolve js builtins
		var builtinsLookup = $.map(['Date','Array','Math'], function(name) { return 'es.undefined-variable[name="' + name + '"]' }).join(',')
		$ast.find(builtinsLookup).removeClass('undefined-variable').addClass('js-builtin')

		// Pass 6, resolve browser builtins
		var browserBuiltinsLookup = $.map(['window','setInterval', 'setTimeout','alert','console','document', 'history'], function(name) { return 'es.undefined-variable[name="' + name + '"]' }).join(',')
		$ast.find(browserBuiltinsLookup).removeClass('undefined-variable').addClass('browser-builtin')
	}

	window.findVariables = findVariables
})()
