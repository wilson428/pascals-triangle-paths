/*
The top tier is considered the 0th-row,
so that the Nth row begins `1  N  ... `

0th:        1
1st:      1   1
2nd:    1   2   1
3rd:  1   3   3   1

*/


// draw the blank triangle

var width = 700,
	height = 375,
	ROW_HEIGHT = 50,
	POINT_SPACE = 75,
	RADIUS = 3,
	RADIUS_BALL = 8,
	BALL_COLOR = "#808080";
	N = 6, // how many rows we're making, starting at 1 1 (the first row)
	PATH_SPEED = 100, // millisecond between each layer as a ball falls
	PATH_DELAY = 400, // delay from one falling ball to the next
	RANDOMSIZE_PATH_ORDER = false; // whether to show the paths in order or not

// This makes SVGs responsive to page size
// https://github.com/TimeMagazine/elastic-svg
var base = elasticSVG("#triangle_container", {
	width: width,
	aspect: height / width,
	resize: "auto"
});

var svg = d3.select(base.svg);

// we're going to call paths through the triangle "routes" to avoid confusion with the <path> element
var box = svg.append("g").attr("id", "box");
var routes = svg.append("g").attr("id", "routes");
var triangle = svg.append("g").attr("id", "triangle");

// the red bar that represents the floor for each row
var floor = box.append("rect").attr("width", width).attr("height", 5).attr("x", 0).attr("y", height-10).style("fill", 'brown');

var rows = triangle.selectAll(".row")
	.data(d3.range(1, N + 2, 1))
	.enter()
	.append("g")
	.attr("id", function(d, i) {
		return "row_" + i;
	})
	.attr("data-row", function(d, i) {
		return i;
	})
	.attr("data-offsetx", function(d, i) {
		var offset = (width - d * POINT_SPACE) / 2;
		return offset;
	})
	.attr("transform", function(d, i) {
		var offset = (width - d * POINT_SPACE) / 2;
		return "translate(" + offset + "," + ROW_HEIGHT * i + ")";
	})
	.classed("grayed_out", function(d, i) {
		return i > 0? true : false;
	});

// add the points to each row
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
		return "translate(" + i * POINT_SPACE + ",0)";
	});

// the dots representing each point in the triangle
points.append("circle")
	.attr("cx", POINT_SPACE / 2)
	.attr("cy", ROW_HEIGHT / 2)
	.attr("r", RADIUS)
	.style("fill", "black");

// the number at this point in Pascal's Triangle
points.append("text")
	.attr("x", POINT_SPACE / 2)
	.attr("y", ROW_HEIGHT / 2 + 25)
	.text("0")
	.style("fill", "black")
	.style("stroke", "none")
	.style("font-size", "20px")
	.style("text-anchor", "middle");


// recursively generate every path down to the Nth-level
// paths are just a string of N 0's and 1's indicating whether they should go left (0) or right (1) at each junction

var ball_count = 0;

var make_paths = function(n) {
	var paths = [];
	var f = function(path) {
		var left = path + "0";
		var right = path + "1";
		if (left.length == n) {
			ball_count += 2;
			paths.push(left, right);
			return;
		}
		f(left);
		f(right);
	}
	f("");
	return paths;
}

// let's make the paths for a triangle down to N levels, no counting the first point
var paths = [["0"]];

for (var c = 1; c <= N; c += 1) {
	paths.push(make_paths(c));
}

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
var animate_path = function(path, callback) {
	var forks = path.split("");

	var coordinates = [get_point_coordinates(0, 0)];

	var ball = triangle.append("circle")
		.attr("cx", coordinates[0].x)
		.attr("cy", coordinates[0].y)
		.attr("r", RADIUS_BALL)
		.style("fill", BALL_COLOR);

	var p_point = 0,
		leg = 0,
		timer;

	for (var p_row = 0; p_row < forks.length; p_row += 1) {
		var fork = forks[p_row];
		if (fork == "1") {
			p_point += 1;
		}
		coordinates.push(get_point_coordinates(p_row + 1, p_point));		
	}

	timer = setInterval(function() {
		var coordinate = coordinates[leg];
		var path_coordinates = coordinates.slice(0, leg + 1);

		routes.append("path")
			.attr("d", line(path_coordinates))
			.style("fill", "none")
			.style("stroke", BALL_COLOR)
			.style("stroke-width", "1px")
			.attr("class", "route");

		ball.attr("cx", coordinate.x).attr("cy", coordinate.y);
		leg += 1;

		if (leg > forks.length) {
			clearTimeout(timer);

			var p_row = coordinates.length - 1;

			triangle.select("#point_" + p_row + "_" + p_point).style("opacity", 1);

			var count = parseInt(triangle.select("#point_" + p_row + "_" + p_point + " text").text(), 10);
			count += 1;
			triangle.select("#point_" + p_row + "_" + p_point + " text").text(count);

			setTimeout(function() {
				routes.selectAll(".route").remove();
				ball.remove();

				callback();				
			}, PATH_DELAY);
		}
	}, PATH_SPEED);
}

// animate all the paths for this level
function animate_paths(level) {
	if (RANDOMSIZE_PATH_ORDER) {
		shuffle(paths[level]);
	}

	// movie the floor
	floor.transition().duration(750).attr("y", level * ROW_HEIGHT + 28);

	setTimeout(function() {
		triangle.select("#row_" + level).classed("grayed_out", false);

		async.eachSeries(paths[level], function(path, callback) {
			animate_path(path, function() {
				callback();
			});	
		}, function() {
			if (level < N) {
				animate_paths(level + 1);
			} else {
				console.log("done");
			}
		});
	}, 750);
}

d3.select("#button button").on("click", function() {
	d3.select(this).attr("disabled", true).classed("disabled", true);

	// start at 1 in the 0th-row
	triangle.select("#point_0_0 text").text("1");
	animate_paths(1);
});

function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}
