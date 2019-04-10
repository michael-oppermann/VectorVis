class ModelGraph {

  constructor(_config, data) {
    this.config = {
      //parentElement: _config.parentElement, 
    }
    
    this.data = data;
    this.initGraph();
  }

  initGraph() {
    let graph = this;

    graph.hosts = d3.map(graph.data, d => d.host).keys();

    graph.events = {};

    // Events per host
    graph.data.forEach(d => {
      if(!(d.host in graph.events)) {
        graph.events[d.host] = [];
      }
      // Convert datetime string to date object
      if(app.temporalOrder == "physical") {
        d.fields.timestamp = moment(d.fields.date).toDate();
        d.fields.time_numeric = d.fields.timestamp.getTime();
      } else {
        d.fields.time_numeric = index;
      }

      graph.events[d.host].push(d);
    });

    // Get happened-before relationships
    for(let host in graph.events) {
      graph.events[host].forEach((d,index) => {

        if(index > 0) {
          d.happenedBefore = graph.getHappenedBefore(d, graph.events[host][index-1]);
        // Special case: add generic init event if this host starts with a connection to an external host
        } else if(Object.keys(d.vectorTimestamp.clock).length > 1) {
          let prevEvent = {} // Create artifical start event
          prevEvent = { host: d.host, vectorTimestamp: { clock: {} }};
          prevEvent.vectorTimestamp.clock[d.host] = 0;
          d.happenedBefore = graph.getHappenedBefore(d, prevEvent);
        }
      });
    }

    // Compute layout (y-positions)
    let hostIterator = {};

    graph.hosts.forEach(d => {
      hostIterator[d] = { host:d, pos:0, index:0 };
    });
    graph.computeVerticalNodePositionsPerHost(hostIterator, graph.hosts[0]);
    
    graph.displayData = [];
    for(let host in graph.events) {
      graph.displayData = graph.displayData.concat(graph.events[host]);
    }

    graph.edges = graph.displayData.filter(d => {
      return d.happenedBefore && d.happenedBefore.type == "external";
    });
  }

  getNodes() {
    return this.displayData;
  }

  getEdges() {
    return this.edges;
  }

  getFilteredEdges(nodes) {
    return nodes.filter(d => {
      return d.happenedBefore && d.happenedBefore.type == "external";
    });
  }
  
  computeVerticalNodePositionsPerHost(hostIterator, host) {
    let graph = this;

    for (let i = hostIterator[host].index; i < graph.events[host].length; i++) {
      let currEvent = graph.events[host][i];

      if(currEvent.pos >= 0) {
        continue;
      }

      // Child connection
      if(!currEvent.happenedBefore || currEvent.happenedBefore.type == "child") {
        hostIterator[host].pos++;
        hostIterator[host].index++;
        currEvent.pos = hostIterator[host].pos;
      } else {
        // Check if y-position for previous event already exists
        let happenedBeforeEvent = currEvent.happenedBefore.event;
        if(!happenedBeforeEvent.hasOwnProperty("pos")) {
          // First compute y-position for related host before continuing in this host
          graph.computeVerticalNodePositionsPerHost(hostIterator, happenedBeforeEvent.host);
          if(currEvent.pos >= 0) {
            continue;
          }
        }
        hostIterator[host].pos = Math.max(hostIterator[host].pos + 1, happenedBeforeEvent.pos + 1);
        hostIterator[host].index++;
        currEvent.pos = hostIterator[host].pos;
      }
    }
  }

  getHappenedBefore(currEvent, prevEvent) {
    let graph = this;
    // Compare current and previous event to see if other clock values have been updated
    let updatedHosts = currEvent.vectorTimestamp.compareUpdatedHosts(prevEvent.vectorTimestamp);

    // Find happened-before event at external host
    if (updatedHosts.length > 0) {
      for (let i = 0; i < updatedHosts.length; i++) {
        const host = updatedHosts[i];

        // Get event with the same clock value
        let happenedBeforeEvent = graph.getEventByClockValue(host, currEvent.vectorTimestamp.clock[host]);
        
        // Check if all hosts match in this event compared to currEvent.
        if (currEvent.vectorTimestamp.compareHosts(happenedBeforeEvent.vectorTimestamp, updatedHosts)) {
          return { type: "external", event: happenedBeforeEvent };
        }
      }
    }
    
    // currEvent has no connection to external hosts
    return { type: "child", event: prevEvent };
  }

  getEventByClockValue(host, clockValue) {
    let graph = this;

    for (let i = 0; i < graph.events[host].length; i++) {
      let currClockValue = graph.events[host][i].vectorTimestamp.clock[host];
      if (currClockValue == clockValue) {
        return graph.events[host][i];
      }
    }
  }
}