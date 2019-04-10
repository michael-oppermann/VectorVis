class DirectedAcyclicGraph {

  constructor(_config) {
    this.config = {
      parentElement: _config.parentElement,
      maxHostWidth: 80,
      //maxCellHeight: 25,
      maxWidth: 600,
      maxDelta: 80
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
        .attr("class", "axis axis--x hide-path");
  }
  
  wrangleDataAndUpdateScales() {
    let vis = this;  

    vis.hosts = d3.map(vis.data, d => d.host).keys();

    vis.events = {};

    // Events per host
    vis.data.forEach(d => {
      if(!(d.host in vis.events)) {
        vis.events[d.host] = [];
      }
      vis.events[d.host].push(d);
    });
/*
    for(let host in vis.events) {
      vis.events[host] = vis.events[host].sort((a, b) => a.vectorTimestamp.clock[host] - b.vectorTimestamp.clock[host]);
    }
*/
    // Get happened-before relationships
    for(let host in vis.events) {
      vis.events[host].forEach((d,index) => {

        if(index > 0) {
          d.happenedBefore = vis.getHappenedBefore(d, vis.events[host][index-1]);
        // Special case: add generic init event if this host starts with a connection to an external host
        } else if(Object.keys(d.vectorTimestamp.clock).length > 1) {
          let prevEvent = {} // Create artifical start event
          prevEvent = { host: d.host, vectorTimestamp: { clock: {} }};
          prevEvent.vectorTimestamp.clock[d.host] = 0;
          d.happenedBefore = vis.getHappenedBefore(d, prevEvent);
        }
      });
    }

    // Compute layout (y-positions)
    let hostIterator = {};

    vis.hosts.forEach(d => {
      hostIterator[d] = { host:d, pos:0, index:0 };
    });
    vis.verticalNodePositionsPerHost(hostIterator, vis.hosts[0]);
    
    vis.displayData = [];
    for(let host in vis.events) {
      vis.displayData = vis.displayData.concat(vis.events[host]);
    }

    // Edges are based on invidiual nodes and their happened-before connections
    vis.edges = vis.displayData.filter(d => {
      return d.happenedBefore && d.happenedBefore.type == "external";
    });
    /*
    vis.edges = []
    vis.displayData.forEach(d => {
      if(d.happenedBefore && d.happenedBefore.type == "external") {
        vis.edges.push({ source:d });
      } else {
        vis.edges.push();
      }
    });
     */
   
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

    vis.xScale = vis.xScale
        .domain(vis.hosts)
        .range([0, vis.config.width]);

    const maxPos = d3.max(vis.displayData, d => d.pos);
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
      .data(vis.edges);

    let connectionEnter = connection.enter().append("line")
        .attr("class", "gridline")
    
    connectionEnter.merge(connection)
      .transition()
        .attr("x1", d => vis.xScale(d.host) + vis.config.hostWidth/2)
        .attr("y1", d => d.pos * vis.config.delta)
        .attr("x2", d => vis.xScale(d.happenedBefore.event.host) + vis.config.hostWidth/2)
        .attr("y2", d => d.happenedBefore.event.pos * vis.config.delta);
    
    connection.exit().remove();


    // Draw nodes
    let node = vis.focus.selectAll(".node")
      .data(vis.displayData, d => {
        return d.id;
      });

    let nodeEnter = node.enter().append("circle")
        .attr("class", "node fill-default")
    
    nodeEnter.merge(node)
      .transition()
        .attr("cx", d => vis.xScale(d.host) + vis.config.hostWidth/2)
        .attr("cy", d => d.pos * vis.config.delta)
        .attr("r", 4);
    
    nodeEnter.on("mouseover", d => {
          console.log(d);
        });
    
    node.exit().remove();
  }

  getHappenedBefore(currEvent, prevEvent) {
    let vis = this;
    // Compare current and previous event to see if other clock values have been updated
    let updatedHosts = currEvent.vectorTimestamp.compareUpdatedHosts(prevEvent.vectorTimestamp);

    // Find happened-before event at external host
    if (updatedHosts.length > 0) {
      for (let i = 0; i < updatedHosts.length; i++) {
        const host = updatedHosts[i];

        // Get event with the same clock value
        let happenedBeforeEvent = vis.eventByClockValue(host, currEvent.vectorTimestamp.clock[host]);
        
        // Check if all hosts match in this event compared to currEvent.
        if (currEvent.vectorTimestamp.compareHosts(happenedBeforeEvent.vectorTimestamp, updatedHosts)) {
          return { type: "external", event: happenedBeforeEvent };
        }
      }
    }
    
    // currEvent has no connection to external hosts
    return { type: "child", event: prevEvent };
  }

  eventByClockValue(host, clockValue) {
    let vis = this;

    for (let i = 0; i < vis.events[host].length; i++) {
      let currClockValue = vis.events[host][i].vectorTimestamp.clock[host];
      if (currClockValue == clockValue) {
        return vis.events[host][i];
      }
    }

/*
    let start=0, end=vis.events[host].length-1; 
          
    while (start <= end) {
      // Find the mid index 
      let mid = Math.floor((start + end)/2); 
      let midVal = vis.events[host][mid].vectorTimestamp.clock[host];
      // If element is present
      if (midVal == clockValue) {
        return vis.events[host][mid];
      } else if (midVal < clockValue) { // Else look in left or right half
        start = mid + 1; 
      } else {
        end = mid - 1;
      }
    }
*/
  }

  verticalNodePositionsPerHost(hostIterator, host) {
    let vis = this;

    for (let i = hostIterator[host].index; i < vis.events[host].length; i++) {
      let currEvent = vis.events[host][i];

      if(currEvent.pos >= 0) {
        continue;
      }

      // Child connection
      if(!currEvent.happenedBefore || currEvent.happenedBefore.type == "child") {
        hostIterator[host].pos++;
        hostIterator[host].index++;
        currEvent.pos = hostIterator[host].pos;
        console.log(currEvent.vectorTimestamp.clock);
        console.log("prev: child");
        console.log("curr: ["+ currEvent.host +"] " + hostIterator[host].pos);
        console.log("curr: " + currEvent.text);
      } else {
        // Check if y-position for previous event already exists
        let happenedBeforeEvent = currEvent.happenedBefore.event;
        if(!happenedBeforeEvent.hasOwnProperty("pos")) {
          // First compute y-position for related host before continuing in this host
          vis.verticalNodePositionsPerHost(hostIterator, happenedBeforeEvent.host);
          if(currEvent.pos >= 0) {
            continue;
          }
        }
        hostIterator[host].pos = Math.max(hostIterator[host].pos + 1, happenedBeforeEvent.pos + 1);
        console.log(currEvent.vectorTimestamp.clock);
        console.log("prev: ["+ happenedBeforeEvent.host +"] " + happenedBeforeEvent.pos);
        console.log("curr: ["+ currEvent.host +"] " + hostIterator[host].pos);
        console.log("curr: " + currEvent.text);
        hostIterator[host].index++;
        currEvent.pos = hostIterator[host].pos;
      }
      console.log(hostIterator[host]);
      console.log("-----");
    }
  }
}
