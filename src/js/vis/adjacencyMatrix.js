class AdjacencyMatrix {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      maxWidth: 250,
      maxCellWidth: 50
    }
    
    this.config.margin = _config.margin || { top: 80, bottom: 5, right: 0, left: 60 };
    
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

    // Init legend elements
    vis.legendContainer = vis.svg.append("g");
    vis.legendGradient = vis.legendContainer.append("linearGradient")
        .attr("id", "legend-gradient");
    vis.legendGradient.append("stop")
        .attr("class", "stop-left");
    vis.legendGradient.append("stop")
        .attr("class", "stop-right")
        .attr("offset", "100%");
    vis.legendContainer.append("rect")
      .attr("width", 100)
      .attr("height", 12)
      .attr("x", 30)
      .attr("fill", "url(#legend-gradient)");
    vis.legendContainer.append("text")
      .attr("class", "legend-label")
      .attr("id", "legend-min-label")
      .attr("text-anchor", "end")
      .attr("x", 20)
      .attr("dy",".9em");
    vis.legendContainer.append("text")
      .attr("class", "legend-label")
      .attr("id", "legend-max-label")
      .attr("text-anchor", "begin")
      .attr("x", 140)
      .attr("dy",".9em");
  }
  
  wrangleDataAndUpdateScales() {
    let vis = this;  
    
    vis.hosts = d3.map(vis.data, d => d.host).keys();

    // Clone object array and then sort by host name
    //vis.edges = Object.assign({}, vis.edges); 

    vis.data.sort((a,b) => d3.ascending(a.host, b.host));


    // Count edges between host pair
    let tmpData = {};
    vis.data.forEach(d => {
      if(!d.happenedBefore) return;
      let source = d.host;
      let target = d.host;
      let external = false;
      if (d.happenedBefore.type == "external") {
        target = d.happenedBefore.event.host;
        external = true;
      }
      const key = source + ";" + target;
      if (!(key in tmpData)) {
        tmpData[key] = 0;
      }
      tmpData[key]++;

      // Hack to count links only once (needs to be refactored)
      if(external) {
        const key = target + ";" + target;
        if (!(key in tmpData)) {
          tmpData[key] = 0;
        }
        tmpData[key]--;
      }
    });

    // Transform associative to regular array
    vis.displayData = [];
    for (var k in tmpData){
      if (tmpData.hasOwnProperty(k) && tmpData[k] > 0) {
        const nodes = k.split(";");
        vis.displayData.push({ "source":nodes[0], "target":nodes[1], "value":tmpData[k] });
      }
    }

    // Update container size
    if(vis.hosts.length * vis.config.maxCellWidth > vis.config.maxWidth) {
      vis.config.cellWidth = vis.config.maxWidth / vis.hosts.length;
    } else {
      vis.config.cellWidth = vis.config.maxCellWidth;
    }

    vis.config.width = vis.config.cellWidth * vis.hosts.length;
    vis.config.containerWidth = vis.config.width + vis.config.margin.left + vis.config.margin.right;
        
    vis.config.containerHeight = $(vis.config.parentElement).height() - app.offsetTop;
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    
    vis.svgContainer
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    // Update scales
    vis.xScale = vis.xScale
        .domain(vis.hosts)
        .range([0, vis.config.width]);

    vis.yScale = vis.yScale
        .domain(vis.hosts)
        .range([0, vis.config.width]);

    vis.colorScale = d3.scaleSequential()
        .domain(d3.extent(vis.displayData, d => d.value))
        .interpolator(d3.interpolateBlues);
    
    vis.updateVis();
    vis.updateLegend();
  }
  
  updateVis() {
    let vis = this;

    // Draw links
    let cell = vis.matrix.selectAll(".cell")
        .data(vis.displayData);

    let cellEnter = cell.enter().append("rect")
        .attr("class", "cell");
    
    cellEnter.merge(cell)
      .transition()
        .attr("x", d => vis.xScale(d.source))
        .attr("y", d => vis.yScale(d.target))
        .attr("width", vis.config.cellWidth)
        .attr("height", vis.config.cellWidth)
        .attr("fill", d => vis.colorScale(d.value));

    cellEnter.merge(cell)
        .on("mouseover", d => app.tooltip.showValue(d.value, { x: d3.event.pageX, y: d3.event.pageY }))
        .on("mouseout", d => app.tooltip.hide());
    
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
        .attr("y2", vis.config.width);

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
        .attr("x2", vis.config.width);

    gridlineY.exit().remove();
  }

  updateLegend() {
    let vis = this;

    vis.legendContainer.attr("transform", "translate(-20," + (vis.config.width + 20) + ")");
    
    var dataDomain = vis.colorScale.domain();
    
    vis.legendGradient.select(".stop-left").attr("stop-color", vis.colorScale(dataDomain[0]));
    vis.legendGradient.select(".stop-right").attr("stop-color", vis.colorScale(dataDomain[1]));

    vis.legendContainer.select("#legend-min-label").text(dataDomain[0]);
    vis.legendContainer.select("#legend-max-label").text(dataDomain[1]);
  }
}
