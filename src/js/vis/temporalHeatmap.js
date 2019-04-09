class TemporalHeatmap {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      cellWidth: 25,
      maxCellHeight: 25,
      maxWidth: 300
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

    vis.xScale = d3.scaleBand();
    vis.xAxis = d3.axisTop(vis.xScale);
    vis.xAxisGroup = vis.focus.append("g")
        .attr("class", "axis axis--x");
  }
  
  wrangleDataAndUpdateScales() {
    let vis = this;  
    
    vis.hosts = d3.map(vis.data, d => d.host).keys();

    // Compute grid size
    vis.config.nCols = vis.hosts.length;
    //vis.config.nRows = d3.max(vis.data, d => d.vectorTimestamp.ownTime); 
    vis.config.nRows = vis.data.length; 
    
    if(vis.config.nCols * vis.config.cellWidth < vis.config.maxWidth) {
      vis.config.width = vis.config.nCols * vis.config.cellWidth;
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

    vis.xScale = vis.xScale
        .domain(vis.hosts)
        .range([0, vis.config.width]);

    vis.config.cellHeight = Math.min(vis.config.maxCellHeight, vis.config.height / vis.config.nRows);
    vis.config.cellWidth = vis.xScale.bandwidth();
    //vis.config.cellWidth = vis.config.width / vis.config.nCols;
    
    vis.updateVis();
  }
  
  updateVis() {
    let vis = this;

    // Update axis
    vis.xAxisGroup.call(vis.xAxis)
      .selectAll("text")
        .attr("text-anchor", "begin")
        .attr("transform", "translate(12,-28) rotate(-90)");

    // Draw heatmap
    let cell = vis.focus.selectAll(".cell")
      .data(vis.data, d => {
        return d.id;
      });

    let cellEnter = cell.enter().append("rect")
        .attr("class", "cell fill-default")
    
    cellEnter.merge(cell)
      .transition()
        .attr("x", d => vis.xScale(d.host))
        //.attr("y", d => (d.vectorTimestamp.ownTime-1) * vis.config.cellHeight)
        .attr("y", (d,index) => index * vis.config.cellHeight)
        .attr("width", vis.config.cellWidth)
        .attr("height", vis.config.cellHeight-1);
    
    cell.exit().remove();
  }
}
