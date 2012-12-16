function drawTree(node, $parent, depth, maxDepth, blacklist) {
	if (!depth) depth = 0;

	if (!blacklist) blacklist = []
	blacklist.push(node)

	var $node = $('<ul class="sortable">').addClass(depth % 2 == 0 ? 'even' : 'odd')

	if (depth+1 < maxDepth || !maxDepth) {
		$.each(node, function(key, item) {
			var $child = $('<li class="row">').appendTo($node)
				.append($('<div class="key">').text(key));

			var valType = $.type(item)

			if (valType.match(/^array|object$/)) {
				if (blacklist.indexOf(item) >= 0) {
					$('<span class="recursion">').text('[recursion]').appendTo($child)
					return;
				} else {
					drawTree(item, $child, depth+1, maxDepth, blacklist)
						.addClass(valType)
						.addClass($.type(key) == 'number' ? 'index-' + key : key)
				}
			}
			else {
				if (valType == 'boolean')
					$child.addClass((item ? 'is-' : 'not-') + key)
				else if (key == 'type')
					$child.addClass(item)
				else if (valType != 'function')
					$child.addClass(key + '-' + item)
				else
					$child.addClass(key)

				if (valType == 'function') {
					if (blacklist.indexOf(item) >= 0) {
						$('<span class="duplicate">').text('[duplicate]').appendTo($child)
						return;
					}

					blacklist.push(item)
				}

				$child.append($('<pre class="value">').text(item !== null ? item.toString() : 'null'));
			}
		})
	}

	return $node.appendTo($parent)
}


