// recursively generate every path down to the nth-level
// paths are just a string of N 0's and 1's indicating whether they should go left (0) or right (1) at each junction

var make_paths = function(N) {
	var paths = [];
	var f = function(path) {
		var left = path + "0";
		var right = path + "1";
		if (left.length == N) {
			paths.push(left, right);
			return;
		}
		f(left);
		f(right);
	}
	f("");
	return paths;
}

// let's make the paths for a triangle down to 5 levels, no counting the first point
var paths = [["0"]];

for (var c = 1; c <= 5; c += 1) {
	paths.push(make_paths(c));
}

console.log(paths);

// draw the empty triangle
var width = 900,
	height = 900,
	ROW_HEIGHT = 75,
	POINT_SPACE = 100,
	RADIUS = 3,
	RADIUS_BALL = 8;	

// This makes SVGs responsive to page size
// https://github.com/TimeMagazine/elastic-svg
var base = elasticSVG("#triangle_container", {
	width: width,
	aspect: 1,
	resize: "auto"
});

var svg = d3.select(base.svg);

var path_routes = svg.append("g").attr("id", "path_routes");
var triangle = svg.append("g").attr("id", "triangle");

var rows = triangle.selectAll(".row")
	.data(d3.range(1, 7, 1))
	.enter()
	.append("g")
	.attr("id", function(d, i) {
		return "row_" + i;
	})
	.attr("data-row", function(d, i) {
		return i;
	})
	.attr("transform", function(d, i) {
		var offset = (width - d * POINT_SPACE) / 2;
		return "translate(" + offset + "," + ROW_HEIGHT * i + ")";
	})
	.attr("data-offsetx", function(d, i) {
		var offset = (width - d * POINT_SPACE) / 2;
		return offset;
	});

// add containers for the points and numbers to each row
var points = rows.selectAll(".point")
	.data(function(d) {
		return d3.range(1, d + 1, 1);
	})
	.enter()
	.append("g")
	.attr("id", function(d, i) {
		var row = this.parentNode.getAttribute("data-row");
		return "point_" + row + "_" + i;
	})
	.attr("transform", function(d, i) {
		var row = this.parentNode.getAttribute("data-row");
		return "translate(" + i * POINT_SPACE + ",0)";
	});

points.append("circle")
	.attr("cx", POINT_SPACE / 2)
	.attr("cy", ROW_HEIGHT / 2)
	.attr("r", RADIUS)
	.style("fill", "black");

points.append("text")
	.attr("x", POINT_SPACE / 2)
	.attr("y", ROW_HEIGHT / 2 + 25)
	.text("0")
	.style("fill", "black")
	.style("stroke", "none")
	.style("font-size", "20px")
	.style("text-anchor", "middle");

var line = d3.line()
	.x(function(d) { return d.x; })
	.y(function(d) { return d.y; });

// for a given row and point index, get the dots's coordinates
var get_point_coordinates = function(row, point) {
	var x = parseInt(svg.select("#row_" + row).attr("data-offsetx"), 10) + point * POINT_SPACE + POINT_SPACE / 2;
	var y = row * ROW_HEIGHT + ROW_HEIGHT / 2; 
	return { x: x, y: y }
}

// for a given path, trace its route through the triangle
var draw_path = function(path) {
	var forks = path.split("");

	var coordinates = [ get_point_coordinates(0, 0) ];

	var p_point = 0;

	forks.forEach(function(fork, p_row) {
		if (fork == "1") {
			p_point += 1;
		}
		coordinates.push(get_point_coordinates(p_row + 1, p_point));
	});

	var terminal = coordinates.slice(-1)[0];

	path_routes.selectAll(".route").remove();
	triangle.selectAll(".ball").remove();

	path_routes.append("path")
		.attr("d", line(coordinates))
		.style("fill", "none")
		.style("stroke", "#C00")
		.style("stroke-width", "1px")
		.attr("class", "route");	

	triangle.append("circle")
		.attr("cx", terminal.x)
		.attr("cy", terminal.y)
		.attr("r", RADIUS_BALL)
		.style("fill", "#C00")
		.attr("class", "ball");

	var p_row = path.length;

	var count = parseInt(triangle.select("#point_" + p_row + "_" + p_point + " text").text(), 10);
	count += 1;
	triangle.select("#point_" + p_row + "_" + p_point + " text").text(count);

}

function draw_paths(level) {
	// shuffle(paths[level]);
	async.eachSeries(paths[5], function(path, callback) {
		setTimeout(function() {
			draw_path(path);
			callback();
		}, 200);
	}, function() {
		console.log("done");
	});
}

draw_paths(5);

var animate_path = function(path, callback) {
	var forks = path.split("");

	var coordinates = [get_point_coordinates(0, 0)];

	var ball = triangle.append("circle")
		.attr("cx", coordinates[0].x)
		.attr("cy", coordinates[0].y)
		.attr("r", RADIUS_BALL)
		.style("fill", "#C00");

	var p_point = 0,
		leg = 0,
		timer;

	forks.forEach(function(fork, p_row) {
		if (fork == "1") {
			p_point += 1;
		}
		coordinates.push(get_point_coordinates(p_row + 1, p_point));
	});

	timer = setInterval(function() {
		var coordinate = coordinates[leg];
		var path_coordinates = coordinates.slice(0, leg + 1);

		path_routes.append("path")
			.attr("d", line(path_coordinates))
			.style("fill", "none")
			.style("stroke", "#C00")
			.style("stroke-width", "1px")
			.attr("class", "route")
			.style("stroke-opacity", 0.1)	

		ball.attr("cx", coordinate.x).attr("cy", coordinate.y);
		leg += 1;
		if (leg > forks.length) {
			clearTimeout(timer);

			var p_row = coordinates.length - 1;

			var count = parseInt(triangle.select("#point_" + p_row + "_" + p_point + " text").text(), 10);
			count += 1;
			triangle.select("#point_" + p_row + "_" + p_point + " text").text(count);

			setTimeout(function() {
				// path_routes.selectAll(".route").remove();
				ball.remove();

				callback();				
			}, 400);
		}
	}, 50);
}


function animate_paths(level) {
	shuffle(paths[level]);
	async.eachSeries(paths[level], function(path, callback) {
		animate_path(path, function() {
			callback();
		});	
	}, function() {
		console.log("done");
	});
}


function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}
