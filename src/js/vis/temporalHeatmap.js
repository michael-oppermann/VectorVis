class TemporalHeatmap {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      //cellWidth: 200,
      //cellHeight: 70,
      headerHeight: 80
    }
    
    this.config.margin = _config.margin || { top: 10, bottom: 20, right: 0, left: 0 };
    
    this.initVis();
  }
  
  initVis() {
    let vis = this;
    
    vis.svgContainer = d3.select(vis.config.parentElement).append("svg");
    
    vis.svg = vis.svgContainer.append("g")
        .attr("transform", "translate(" + vis.config.margin.left + "," + vis.config.margin.top + ")");

    vis.xScale = d3.scaleBand();
    
    vis.grid = vis.svg.append("g");
  }
  
  wrangleDataAndUpdateScales() {
    let vis = this;  
    
    vis.hosts = d3.map(vis.data, d => d.host).keys();

    // Update container size
    vis.config.containerWidth = $(vis.config.parentElement).width();
    console.log(vis.config.containerWidth);
    vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    
    // Compute grid size
    vis.config.nCols = vis.hosts.length;
    vis.config.nRows = d3.max(vis.data, d => d.vectorTimestamp.ownTime); 
    
    vis.config.containerHeight = $(vis.config.parentElement).height();
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    
    vis.svgContainer
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    vis.xScale = vis.xScale
        .domain(vis.hosts)
        .range([0, vis.config.width]);

    vis.config.cellHeight = vis.config.height / vis.config.nRows;
    vis.config.cellWidth = vis.xScale.bandwidth();
    //vis.config.cellWidth = vis.config.width / vis.config.nCols;
    
    vis.updateVis();
  }
  
  updateVis() {
    let vis = this;

    let cell = vis.grid.selectAll(".cell")
      .data(vis.data, d => {
        return d.id;
      });

    let cellEnter = cell.enter().append("rect")
        .attr("class", "cell")
    
    cellEnter.merge(cell)
      .transition()
        .attr("x", d => vis.xScale(d.host))
        .attr("y", d => (d.vectorTimestamp.ownTime-1) * vis.config.cellHeight)
        .attr("width", vis.config.cellWidth)
        .attr("height", vis.config.cellHeight);
    
    cell.exit().remove();
  }
}
