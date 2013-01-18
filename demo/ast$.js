var escope = require('escope')

function cleanComment(str) {
	var cleaned = [],
		symbols = '[/*#-]+',
		junk = new RegExp('^\\s*' + symbols + '|' + symbols + '\\s*$')
	$.each(str.split('\n'), function(line, lstr) {
		var s = lstr.replace(junk, '')
		if ($.trim(s))
			cleaned.push(s)
	})
	return cleaned.join('\n')
}

function ast$(raw, ast) {
	var $ast = $('<ast>'),
		spaces = '    ',
		indent = '\n' + spaces,
		doubleIndent = '\n' + spaces + spaces,
		header = '\n------------------------',
		extractQueue = []

	function processExtractQueue() {
		if (extractQueue.length)
			extractComments(extractQueue.shift(), processExtractQueue)
	}

	// Need to optimize this, super slow..
	function extractComments($code, next) {
		var t0 = new Date().valueOf()
		for (var i=0; i < ast.comments.length; ) {
			var comment = ast.comments[i],
				text

			if (comment.range[0] >= $code.data('range0') && comment.range[1] <= $code.data('range1')) {
				ast.comments.splice(i,1)

				if ($code[0].childNodes.length === 1) {
					text = $.trim(raw.substring($code.data('range0'), comment.range[0]))
					if (text.length) {
						$('<code>')
							.text(text)
							.data('range0', $code.data('range0'))
							.data('range1', comment.range[0])
							.insertBefore($code)
					}

					$('<comment>')
						.addClass(comment.type)
						.html(cleanComment(raw.substring(comment.range[0], comment.range[1])))
						.insertBefore($code)

					text = $.trim(raw.substring(comment.range[1], $code.data('range1')))
					if (text.length) {
						$code
							.text(text)
							.data('range0', comment.range[1])
							.data('range1', $code.data('range1'))
					} else {
						$code.remove()
						break;
					}
				} else {
					console.log('assertion failed')
				}
			} else {
				i++
			}
		}
		var t1 = new Date().valueOf()
		//console.log('extract comment dt', t1-t0)

		setTimeout(next,0)
	}

	var x = 0
	function recurse(n, $parent, classes, keySummary) {
		var $es = $('<es>')
			.appendTo($parent)
			.addClass(n.type)
			.addClass(classes)
			.attr({
				title: n.type
			})
			.data('node', n)

		if (n.type === 'Identifier') {
			$es.attr({
				title: $es.attr('title') + indent + '.name = ' + n.name,
				name: n.name
			})
		}

		$es.data('preceedingRawCode', raw.substring(x, n.range[0]))

		var $preceedingRawCode = $('<code>')
			.text($es.data('preceedingRawCode'))
			.data('range0', x)
			.data('range1', n.range[0])
			.insertBefore($es)

		extractQueue.push($preceedingRawCode)

		x = n.range[0]

		$.each(n, function(k,v) {
			var isChild = estraverse.VisitorKeys[n.type].indexOf(k) >= 0,
				child = isChild ? n[k] : null

			if ($.isArray(child)) {
				$.each(child, function(i) {
					var classes = (k + '_') + ' ' + ('_' + i),
						keySummary = (n.type + indent + '.' + k + '[' + i + ']')
					recurse(this, $es, classes, keySummary)
				})
			} else if (child) {
				var classes = k,
					keySummary = (n.type + indent + '.' + k)
				recurse(child, $es, classes, keySummary)
			} else {
				if (typeof v === 'boolean') {
					$es.addClass(k + '-' + v.toString())
					$es.attr('title', $es.attr('title') + indent + '.' + k + ' = ' + v.toString())
				}
			}

			$es.data(k, v)
		})

		if (keySummary)
			$es.attr('title', $es.attr('title') + header + '\n' + keySummary)

		$es.data('trailingRawCode', raw.substring(x, n.range[1]))

		var $trailingRawCode = $('<code>')
			.text($es.data('trailingRawCode'))
			.data('range0', x)
			.data('range1', n.range[1])
			.appendTo($es)

		extractQueue.push($trailingRawCode)

		x = n.range[1]
	}

	recurse(ast, $ast)

	processExtractQueue()

	return $ast
}

function codeFrom$($ast) {
	var code = []
	
	function recurse($es) {
		code.push($es.data('preceedingRawCode'))

		if (!$es.hasClass('marked-for-removal')) {
			$es.find('> es').each(function() {
				recurse($(this))
			})

			code.push($es.data('trailingRawCode'))
		}
	}

	recurse($ast)

	return code.join('')
}

