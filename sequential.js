// draw the triangle

var width = 900,
	height = 900,
	ROW_HEIGHT = 75,
	POINT_SPACE = 100,
	RADIUS = 3,
	RADIUS_BALL = 8,
	DURATION = 1000,
	NUMBER_OF_ROWS = 5; // how many rows we're making, start at 1 1 (the second row)

// This makes SVGs responsive to page size
// https://github.com/TimeMagazine/elastic-svg
var base = elasticSVG("#triangle_container", {
	width: width,
	aspect: 1,
	resize: "auto"
});

var svg = d3.select(base.svg);

// we're going to call paths through the triangle "routes" to avoid confusion with the <path> element

var routes = svg.append("g").attr("id", "routes");
var triangle = svg.append("g").attr("id", "triangle");

var rows = triangle.selectAll(".row")
	.data(d3.range(1, NUMBER_OF_ROWS + 2, 1))
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

// the dots representing each number in the triangle
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

var line = d3.line()
	.x(function(d) { return d.x; })
	.y(function(d) { return d.y; });

// for a given row and point index, get the dots's coordinates
var get_point_coordinates = function(row, point) {
	var x = parseInt(svg.select("#row_" + row).attr("data-offsetx"), 10) + point * POINT_SPACE + POINT_SPACE / 2;
	var y = row * ROW_HEIGHT + ROW_HEIGHT / 2; 
	return { x: x, y: y }
}

// for a given point, travel to each of the two points below it
// `point` is { row: [row], point: [point index] }
var fork = function(point) {
	if (point.row == NUMBER_OF_ROWS) {
		return;
	}

	var coordinate = get_point_coordinates(point.row, point.point);

	var ball = triangle.append("circle")
		.attr("cx", coordinate.x)
		.attr("cy", coordinate.y)
		.attr("r", RADIUS_BALL)
		.style("fill", "#C00");

	var left = { row: point.row + 1, point: point.point };
	var right = { row: point.row + 1, point: point.point + 1 };

	var coordinate_left = get_point_coordinates(left.row, left.point);
	var coordinate_right = get_point_coordinates(right.row, right.point);

	var ball_left = triangle.append("circle")
		.attr("cx", coordinate.x)
		.attr("cy", coordinate.y)
		.attr("r", RADIUS_BALL)
		.style("fill", "#C00");

	var ball_right = triangle.append("circle")
		.attr("cx", coordinate.x)
		.attr("cy", coordinate.y)
		.attr("r", RADIUS_BALL)
		.style("fill", "#C00");

	ball.remove();

	var delay = Math.random() * 5000;

	setTimeout(function() {
		// animate them to their new positions
		ball_left.transition().duration(DURATION)
			.attr("cx", coordinate_left.x)
			.attr("cy", coordinate_left.y)
			.attr("r", RADIUS_BALL)
			.on("end", function() {
				// update the count for the new position
				var count = parseInt(triangle.select("#point_" + left.row + "_" + left.point + " text").text(), 10);
				count += 1;
				triangle.select("#point_" + left.row + "_" + left.point + " text").text(count);
				ball_left.remove();
				fork(left);
			});
	}, delay);

	setTimeout(function() {
		ball_right.transition().duration(DURATION)
			.attr("cx", coordinate_right.x)
			.attr("cy", coordinate_right.y)
			.attr("r", RADIUS_BALL)
			.on("end", function() {
				// update the count for the new position
				var count = parseInt(triangle.select("#point_" + right.row + "_" + right.point + " text").text(), 10);
				count += 1;
				triangle.select("#point_" + right.row + "_" + right.point + " text").text(count);
				ball_right.remove();
				fork(right);
			});
	}, delay);

}

triangle.select("#point_0_0 text").text("1");

fork({ row: 0, point: 0 })




var make_triangle = function(callback) {


}