class Timeline {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      nBins: 30
    }
    
    this.config.margin = _config.margin || { top: 50, bottom: 20, right: 5, left: 5 };
    
    this.initVis();
  }
  
  initVis() {
    let vis = this;
    
    vis.svgContainer = d3.select(vis.config.parentElement).append("svg");
    
    vis.svg = vis.svgContainer.append("g")
        .attr("transform", "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")");

    vis.focus = vis.svg.append("g");

    vis.xScale = d3.scaleLinear();
    vis.yScale = d3.scaleLinear();

    vis.xAxis = d3.axisTop(vis.xScale)
        .tickPadding(8)
        .ticks(4);

    vis.xAxisGroup = vis.focus.append("g")
        .attr("class", "axis axis--x hide-path ticks-light");
    
    vis.focus.append("path").attr("class", "timeline-path fill-default");

    // Area generator
    vis.area = d3.area()
        .y(d => vis.yScale(d.x0))
        .x0(0)
        .x1(d => vis.xScale(d.length));
  }
  
  wrangleDataAndUpdateScales() {
    let vis = this;

    // Update container size
    vis.config.containerWidth = $(vis.config.parentElement).width();
    vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    
    vis.config.containerHeight = $(vis.config.parentElement).height();
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    
    vis.svgContainer
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.yScale
        .domain(d3.extent(vis.data, d => d.fields.time_numeric))
        .range([0, vis.config.height]);

    // Set parameters for histogram
    vis.histogram = d3.histogram()
        .value(d => d.fields.time_numeric)
        .domain(vis.yScale.domain())
        .thresholds(vis.yScale.ticks(vis.config.nBins));

    // Generate bins
    vis.bins = vis.histogram(vis.data);

    vis.xScale
        .domain([0, d3.max(vis.bins, d => d.length)])
        .range([0, vis.config.width]);

    vis.xAxis.tickSize(-vis.config.height);

    vis.updateVis();
  }
  
  updateVis() {
    let vis = this;

    // Update axis
    vis.xAxisGroup.call(vis.xAxis);

    // Draw path
    /*
    vis.focus.select(".timeline-path")
        .datum(vis.bins)
        .attr("d", vis.area);*/

    // Draw bars
    let bar = vis.focus.selectAll(".bar")
        .data(vis.bins);

    let barEnter = bar.enter().append("rect")
        .attr("class", "bar");
    
    barEnter.merge(bar)
      .transition()
        .attr("y", d => vis.yScale(d.x0))
        .attr("width", d => vis.xScale(d.length))
        .attr("height",d => vis.yScale(d.x1) - vis.yScale(d.x0));
    
    bar.exit().remove();
  }
}
