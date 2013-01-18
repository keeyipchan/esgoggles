function Benchmark() {
	this.results = []
}
Benchmark.prototype.report = function() {
	$.each(this.results, function(_, result) {
		console.log(result.name, result.duration, 'ms')
	})
	return this
}
Benchmark.prototype.time = function(name, f) {
	var t0 = new Date().valueOf()
	f()
	var t1 = new Date().valueOf()
	this.results.push({
		name: name,
		duration: t1 - t0
	})
	return this
}

