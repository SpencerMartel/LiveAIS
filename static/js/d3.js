// Tutorial: https://jonsadka.com/blog/how-to-create-adaptive-pie-charts-with-transitions-in-d3/


var width = 300
var height = 300

var svg = d3
    .select("#chart-1")
    .attr("background-color", "transparent")
    .append('svg')
    .attr("width", width)
    .attr("height", height)

// Create circles (data)
svg.append("circle").attr("cx", 100).attr("cy", 130).attr("r", 6).style("fill", "red").on('mouseover',function(d){ console.log(d);});
svg.append("circle").attr("cx", 100).attr("cy", 160).attr("r", 6).style("fill", "blue").on('mouseover',function(d){ console.log(d);});

function responsivefy(svg) {
    // get container + svg aspect ratio
    var container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style("width")),
        height = parseInt(svg.style("height")),
        aspect = width / height;

    // add viewBox and preserveAspectRatio properties,
    // and call resize so that svg resizes on inital page load
    svg.attr("viewBox", "0 0 " + width + " " + height)
        .attr("perserveAspectRatio", "xMinYMid")
        .call(resize);

    // to register multiple listeners for same event type, 
    // you need to add namespace, i.e., 'click.foo'
    // necessary if you call invoke this function for multiple svgs
    // api docs: https://github.com/mbostock/d3/wiki/Selections#on
    d3.select(window).on("resize." + container.attr("id"), resize);

    // get width of container and resize svg to fit it
    function resize() {
        var targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
    }
}

// Text in center of pie
svg.append("text").attr("x", 115).attr("y", 132).text("Docked boats")
    .style("font-size", "15px")
    .style("fill", "#FAF9F6")
    .attr("alignment-baseline","middle")
svg.append("text").attr("x", 115).attr("y", 162).text("Moving boats")
    .style("font-size", "15px")
    .style("fill", "#FAF9F6")
    .attr("alignment-baseline","middle")


var g = svg
    .append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')


var min = Math.min(width, height)
var oRadius = (min / 2) * 0.9
var iRadius = (min / 2) * 0.75

// construct default pie layout
var pie = d3
    .pie()
    .value(function (d) {
        return d
    })
    .sort(null)

// construct arc generator
var arc = d3.arc().outerRadius(oRadius).innerRadius(iRadius)

// Define colors
var color = d3.scaleLinear().range(["red", "blue"])

function renderPieChart(dataArray) {
    // dataArray contains [% of docked boats, % of moving boats] 
    let newDataArray = dataArray
    // Store the displayed angles in _current.
    // Then, interpolate from _current to the new angles.
    // During the transition, _current is updated in-place by d3.interpolate.
    function arcTween(a) {
        var i = d3.interpolate(this._current, a)
        this._current = i(0)
        return function (t) {
            return arc(i(t))
        }
    }

    g.datum(dataArray).selectAll('path').data(pie).transition().attrTween('d', arcTween)

    // add any new pie segments
    g.datum(dataArray)
        .selectAll('path')
        .data(pie)
        .enter()
        .append('path')
        .attr('class', 'piechart')
        .attr('fill', function (d, i) {
            return color(i)
        })
        .attr('d', arc)
        .each(function (d) {
            this._current = d
        })

    // remove data not used
    g.datum(dataArray).selectAll('path').data(pie).exit().remove()
}