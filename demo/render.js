var nodeTypeRender = {
	Identifier: function($node, node) {
		$node.text(node.name).data('name', node.name)
	},
	Literal: function($node, node) {
		$node.append($('<pre>').text(node.value === null ? 'null' : node.raw)).data('value', node.raw)
	},
	BlockStatement: function($node, node) {
		$node.addClass('toggle closed')
		//$node.attr('title', 'ALT + Click, collapse this region')
	}
}

$('.toggle.closed').live('click', function(event) {
	var $t = $(event.target).closest('.toggle');
	$t.removeClass('closed')
	$t.scrollintoview({offset:100})
	event.stopPropagation()
});

$('.toggle:not(.closed)').live('click', function(event) {
	if (event.altKey) {
		var $t = $(event.target).closest('.toggle')
		$t.addClass('closed')
		$t.scrollintoview({
			offset:100,
			complete: function() {
				$t.effect("pulsate", { times:4 }, 500);
			}
		})
		event.stopPropagation()
		event.preventDefault()

		$.unselect();
	}
});

function render(node, $parent, depth, path) {
	if (!depth) depth = 0;
	if (!path) path = [];

	if (!node) {
		return $('<es>').addClass('null');
	}

	var $node = $('<es>').addClass(node.type)
	if (node.operator) {
		if (!estraverse.Operators[node.operator])
			console.log('operator: ' + node.operator)
		$node.addClass('op ' + estraverse.Operators[node.operator])
	}

	nodeTypeRender[node.type] && nodeTypeRender[node.type]($node,node)

	var visitorKeys = estraverse.VisitorKeys[node.type]
	$.each(node, function(key, val) {
		if (visitorKeys && visitorKeys.indexOf(key) >= 0)
			return;
		if ($.type(val) == 'boolean' && val)
			$node.addClass('is-' + key);
	});

	if (visitorKeys) {
		var childPath = path.concat(node)
		$.each(visitorKeys, function(_i_, key) {
			var $item = $('<es>').addClass(key).appendTo($node)

			if ($.type(node[key]) == 'array') {
				$.each(node[key], function(i, child) {
					render(child, $('<es>').addClass('index-' + i).appendTo($item), depth+1, childPath)
				})
			} else {
				render(node[key], $item, depth+1, childPath)
			}
		})
	} else {
		console.log('--------')
		console.log(node.type)
		console.dir(node)
		console.log('--path--')
		console.dir(path)
	}

	return $node.appendTo($parent)
}

