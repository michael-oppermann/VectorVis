class Timeline {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      eventHandler: _config.eventHandler,
      nBins: 30,
    }
    
    this.config.margin = _config.margin || { top: 20, bottom: 20, right: 12, left: 20 };
    
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
        .attr("class", "axis axis--x hide-path hide-labels ticks-light");
    
    vis.timelineRect = vis.focus.append("rect")
        .attr("class", "timeline-rect fill-light")
        .attr("opacity", 0);

    // Brush
    vis.svgContainer.append("g")
        .attr("transform", "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")")
        .attr("class", "brush");

    vis.brush = d3.brushY()
        .on("end", brushed);

    function brushed() {
      let s = d3.event.selection;
      let selectedRangeSnapped = [];

      if(s) {
        let selectedRange = s.map(vis.yScale.invert, vis.yScale);
        selectedRangeSnapped = selectedRange.map(d => Math.round(d));
      }

      app.filter.time = selectedRangeSnapped;
      $(vis.config.eventHandler).trigger("selectionChanged");
    }

    // Add label
    vis.svgContainer.append("text")
        .attr("class", "timeline-label")
        .attr("transform", d => "translate(16, 20), rotate(-90)")
        .attr("text-anchor", "end")
        .text("← TIME");
  }
  
  wrangleDataAndUpdateScales() {
    let vis = this;

    // Update container size
    vis.config.containerWidth = $(vis.config.parentElement).width();
    vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    
    vis.config.containerHeight = $(vis.config.parentElement).height() - app.offsetTop;
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    
    vis.svgContainer
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.brush.extent([[0, 0], [vis.config.width, vis.config.height]]);

    vis.yScale
        .domain(d3.extent(vis.data, d => d.fields.time_numeric))
        .range([0, vis.config.height]);

    if(app.temporalOrder == "physical") {
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
    } else {
      vis.timelineRect
          .attr("width", vis.config.width)
          .attr("height", vis.config.height);
    }

    vis.updateVis();
  }
  
  updateVis() {
    let vis = this;

    if(app.temporalOrder == "physical") {
      // Update axis
      vis.xAxisGroup.call(vis.xAxis);

      // Draw bars
      let bar = vis.focus.selectAll(".bar")
          .data(vis.bins);

      let barEnter = bar.enter().append("rect")
          .attr("class", "bar fill-light");
      
      barEnter.merge(bar)
        .transition()
          .attr("y", d => vis.yScale(d.x0))
          .attr("width", d => vis.xScale(d.length))
          .attr("height",d => vis.yScale(d.x1) - vis.yScale(d.x0));
      
      bar.exit().remove();

      vis.timelineRect.attr("opacity", 0);
    } else {
      vis.focus.selectAll(".bar").remove();
      vis.timelineRect.attr("opacity", 1);
    }

    // Update brush
    vis.svgContainer.select(".brush")
        .call(vis.brush);
  }
}
