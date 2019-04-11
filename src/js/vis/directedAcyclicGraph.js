class DirectedAcyclicGraph {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      maxHostWidth: 90,
      //maxCellHeight: 25,
      maxWidth: 600,
      maxDelta: 100
    }
    
    this.config.margin = _config.margin || { top: 80, bottom: 20, right: 0, left: 10 };
    
    this.initVis();
  }
  
  initVis() {
    let vis = this;
    
    vis.svgContainer = d3.select(vis.config.parentElement).append("svg");
    
    vis.svg = vis.svgContainer.append("g")
        .attr("transform", "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")");

    vis.focus = vis.svg.append("g");

    vis.yScale = d3.scaleLinear();

    vis.xScale = d3.scaleBand();
    vis.xAxis = d3.axisTop(vis.xScale);
    vis.xAxisGroup = vis.focus.append("g")
        .attr("class", "axis axis--x hide-path");
  }
  
  wrangleDataAndUpdateScales() {
    let vis = this;

    vis.hosts = d3.map(vis.nodes, d => d.host).keys();
   
    if((vis.hosts.length * vis.config.maxHostWidth) < vis.config.maxWidth) {
      vis.config.width = vis.hosts.length * vis.config.maxHostWidth;
    } else {
      vis.config.width = vis.config.maxWidth;
    }

    // Update container size
    vis.config.containerWidth = vis.config.width + vis.config.margin.left + vis.config.margin.right;
    vis.config.containerHeight = $(vis.config.parentElement).height() - app.offsetTop;
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    
    vis.svgContainer
        .attr("width", vis.config.containerWidth)
        .attr("height", vis.config.containerHeight);

    const yPosExtent = d3.extent(vis.nodes, d => d.pos); // Extent of vertical positions
    if((vis.config.height / (yPosExtent[1]-yPosExtent[0])) > vis.config.maxDelta) {
      vis.config.height = (yPosExtent[1]-yPosExtent[0]) * vis.config.maxDelta;
    }

    vis.yScale
        .domain(yPosExtent)
        .range([0, vis.config.height]);

    vis.xScale
        .domain(vis.hosts)
        .range([0, vis.config.width]);

    const maxPos = d3.max(vis.nodes, d => d.pos);
    vis.config.delta = Math.min(vis.config.maxDelta, vis.config.height / maxPos);
    vis.config.hostWidth = vis.xScale.bandwidth();
   
    vis.updateVis();
  }
  
  updateVis() {
    let vis = this;

    // Update axis
    vis.xAxisGroup.call(vis.xAxis)
      .selectAll("text")
        .attr("text-anchor", "end")
        .attr("dx", ".15em")
        .attr("dy", ".25em")
        .attr("transform", "translate(-10,-10) rotate(90)");

    // Vertical lines
    let hostLine = vis.focus.selectAll(".gridline")
      .data(vis.hosts);

    let hostLineEnter = hostLine.enter().append("line")
        .attr("class", "gridline")
    
    hostLineEnter.merge(hostLine)
      .transition()
        .attr("x1", d => vis.xScale(d) + vis.config.hostWidth/2)
        .attr("x2", d => vis.xScale(d) + vis.config.hostWidth/2)
        .attr("y2", vis.config.height);
    
    hostLine.exit().remove();

    // Draw connection
    let connection = vis.focus.selectAll(".connection")
      .data(vis.edges, d => {
        return d.id;
      });

    let connectionEnter = connection.enter().append("line")
        .attr("class", "connection")
    
    connectionEnter.merge(connection)
      .transition()
        .attr("x1", d => vis.xScale(d.host) + vis.config.hostWidth/2)
        .attr("y1", d => vis.yScale(d.pos))
        .attr("x2", d => vis.xScale(d.happenedBefore.event.host) + vis.config.hostWidth/2)
        .attr("y2", d => vis.yScale(d.happenedBefore.event.pos));
    
    connection.exit().remove();


    // Draw nodes
    let node = vis.focus.selectAll(".node")
      .data(vis.nodes, d => {
        return d.id;
      });

    let nodeEnter = node.enter().append("circle")
        .attr("class", "node fill-default")
    
    nodeEnter.merge(node)
      .transition()
        .attr("cx", d => vis.xScale(d.host) + vis.config.hostWidth/2)
        .attr("cy", d => vis.yScale(d.pos))
        .attr("r", 4);
    
    nodeEnter.merge(node)
        .on("mouseover", d => app.tooltip.showEvent(d, { x: d3.event.pageX, y: d3.event.pageY }))
        .on("mouseout", d => app.tooltip.hide());
    
    node.exit().remove();
  }
}
