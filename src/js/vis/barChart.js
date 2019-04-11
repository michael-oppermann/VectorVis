class BarChart {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      x: _config.x,
      y: _config.y,
      barHeight: 30,
      maxHeight: 300
    }
    
    this.config.margin = _config.margin || { top: 30, bottom: 10, right: 15, left: 60 };
    
    this.initVis();
  }
  
  initVis() {
    let vis = this;
    
    vis.svgContainer = d3.select(vis.config.parentElement).append("svg");
    
    vis.svg = vis.svgContainer.append("g")
        .attr("transform", "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")");

    vis.focus = vis.svg.append("g");

    // Initialize scales and axes
    vis.xScale = d3.scaleLinear();
    vis.yScale = d3.scaleBand();

    vis.xAxis = d3.axisTop(vis.xScale)
        .tickPadding(8)
        .ticks(4);
    vis.yAxis = d3.axisLeft(vis.yScale);

    vis.xAxisGroup = vis.focus.append("g")
        .attr("class", "axis axis--x hide-path ticks-medium");

    vis.yAxisGroup = vis.focus.append("g")
        .attr("class", "axis axis--y hide-path");
  }
  
  wrangleDataAndUpdateScales() {
    let vis = this;  
    
    let yDomain = d3.map(vis.data, d => d[vis.config.y]).keys();

    // Update container size
    vis.config.containerWidth = $(vis.config.parentElement).width();
    vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    
    // Dynamic bar chart height
    if(vis.config.barHeight * yDomain.length > vis.config.maxHeight) {
      vis.config.barHeight = vis.config.maxHeight / yDomain.length;
      vis.config.height = vis.config.maxHeight;
    } else {
      vis.config.height = vis.config.barHeight * yDomain.length;
    }

    vis.config.containerHeight = vis.config.height + vis.config.margin.top + vis.config.margin.bottom;

    vis.svgContainer
        .attr("width", vis.config.containerWidth)
        .attr("height", vis.config.containerHeight);

    // Update scales
    vis.xScale = vis.xScale
        .domain([0, d3.max(vis.data, d => d[vis.config.x])])
        .range([0, vis.config.width]);

    vis.yScale = vis.yScale
        .domain(yDomain)
        .range([0, vis.config.height]);

    vis.xAxis.tickSize(-vis.config.height);
    
    vis.updateVis();
  }
  
  updateVis() {
    let vis = this;

    // Draw bars
    let bar = vis.focus.selectAll(".bar")
        .data(vis.data);

    let barEnter = bar.enter().append("rect")
        .attr("class", "bar fill-default");
    
    barEnter.merge(bar)
      .transition()
        .attr("y", d => vis.yScale(d[vis.config.y]))
        .attr("width", d => vis.xScale(d[vis.config.x]))
        .attr("height", vis.config.barHeight-1);

    barEnter.merge(bar)
        .on("mouseover", d => app.tooltip.showValue(d[vis.config.x], { x: d3.event.pageX, y: d3.event.pageY }))
        .on("mouseout", d => app.tooltip.hide());
    
    bar.exit().remove();

    // Draw axes and grid lines
    vis.yAxisGroup.call(vis.yAxis);
    vis.xAxisGroup.call(vis.xAxis);
  }
}
