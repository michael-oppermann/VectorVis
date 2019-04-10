class AdjacencyMatrix {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      
    }
    
    this.config.margin = _config.margin || { top: 80, bottom: 5, right: 0, left: 100 };
    
    this.initVis();
  }
  
  initVis() {
    let vis = this;
    
    vis.svgContainer = d3.select(vis.config.parentElement).append("svg");
    
    vis.svg = vis.svgContainer.append("g")
        .attr("transform", "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")");

    vis.focus = vis.svg.append("g");
    vis.matrix = vis.focus.append("g");

    // Initialize scales and axes
    vis.xScale = d3.scaleBand();
    vis.yScale = d3.scaleBand();

    vis.xAxis = d3.axisTop(vis.xScale);
    vis.yAxis = d3.axisLeft(vis.yScale);

    vis.xAxisGroup = vis.focus.append("g")
        .attr("class", "axis axis--x");

    vis.yAxisGroup = vis.focus.append("g")
        .attr("class", "axis axis--y");
  }
  
  wrangleDataAndUpdateScales() {
    let vis = this;  
    
    vis.hosts = d3.map(vis.data.nodes, d => d.name).keys();

    // Update container size
    vis.config.containerWidth = $(vis.config.parentElement).width();
    vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        
    vis.config.containerHeight = $(vis.config.parentElement).height() - app.offsetTop;
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    
    vis.svgContainer
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.config.cellWidth = Math.max(vis.config.width,vis.config.height) / vis.hosts.length;
    vis.config.cellWidth = vis.config.cellWidth > 50 ? 50 : vis.config.cellWidth;

    vis.config.matrixWidth = vis.config.cellWidth * vis.hosts.length;

    // Update scales
    vis.xScale = vis.xScale
        .domain(vis.hosts)
        .range([0, vis.config.matrixWidth]);

    vis.yScale = vis.yScale
        .domain(vis.hosts)
        .range([0, vis.config.matrixWidth]);

    vis.colorScale = d3.scaleSequential()
        .domain(d3.extent(vis.data.links, d => d.value))
        .interpolator(d3.interpolateBlues);
    
    vis.updateVis();
  }
  
  updateVis() {
    let vis = this;

    // Draw links
    let cell = vis.matrix.selectAll(".cell")
        .data(vis.data.links);

    let cellEnter = cell.enter().append("rect")
        .attr("class", "cell");
    
    cellEnter.merge(cell)
      .transition()
        .attr("x", d => vis.xScale(d.source))
        .attr("y", d => vis.yScale(d.target))
        .attr("width", vis.config.cellWidth)
        .attr("height", vis.config.cellWidth)
        .attr("fill", d => vis.colorScale(d.value));
    
    cell.exit().remove();

    // Draw axes and grid lines
    vis.yAxisGroup.call(vis.yAxis);
    vis.xAxisGroup.call(vis.xAxis)
      .selectAll("text")
        .attr("text-anchor", "end")
        .attr("dx", ".15em")
        .attr("dy", ".25em")
        .attr("transform", "translate(-10,-10) rotate(90)");
    
    let gridlineX = vis.focus.selectAll(".gridline-x")
        .data(vis.hosts);

    let gridlineXEnter = gridlineX.enter().append("line")
        .attr("class", "gridline gridline-x");

    gridlineXEnter.merge(gridlineX)
      .transition()
        .attr("x1", d => vis.xScale(d) + vis.config.cellWidth)
        .attr("y1", 0)
        .attr("x2", d => vis.xScale(d) + vis.config.cellWidth)
        .attr("y2", vis.config.matrixWidth);

    gridlineX.exit().remove();

    let gridlineY = vis.focus.selectAll(".gridline-y")
        .data(vis.hosts);

    let gridlineYEnter = gridlineY.enter().append("line")
        .attr("class", "gridline gridline-y");

    gridlineYEnter.merge(gridlineY)
      .transition()
        .attr("y1", d => vis.yScale(d) + vis.config.cellWidth)
        .attr("x1", 0)
        .attr("y2", d => vis.yScale(d) + vis.config.cellWidth)
        .attr("x2", vis.config.matrixWidth);

    gridlineY.exit().remove();
  }
}
