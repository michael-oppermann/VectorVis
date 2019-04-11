// Webserver path 
//const path = "/ubc/ds/dsvis/";
const path = "";

let examplesData;
let selectedExample;

// Helper class to get happened-before relationships and node positions for DAG.
let graph;

// All events
let logEvents;

// Events and connections in selected time window
let filteredLogEvents; 
let filteredConnections; 

// Event handler for temporal selections
let OverviewEventHandler = {};

// Search parameters (fuse.js library)
let fuse;
const fuseSearchOptions = {
  tokenize: true,
  matchAllTokens: true,
  threshold: 0.1,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [
    "text",
    "host",
    "fields.action"
  ]
};

// Overview vis
let timeline = new Timeline({ parentElement: "#timeline", eventHandler: OverviewEventHandler });

// Selection vis
let temporalHeatmap = new TemporalHeatmap({ parentElement: "#temporal-heatmap" });
let adjacencyMatrix = new AdjacencyMatrix({ parentElement: "#adjacency-matrix" });
let dag = new DirectedAcyclicGraph({ parentElement: "#dag" });
let hostDistributionChart = new BarChart({ parentElement: "#host-distribution .bar-chart", y:"key", x:"value" });
let actionDistributionChart = new BarChart({ parentElement: "#action-distribution .bar-chart", y:"key", x:"value" });

// Initalize global tooltip
let tooltip = new Tooltip({ parentElement: "#global-tooltip" });

let app = {
  offsetTop: 45,
  filter: {
    time: [],
    tags: []
  },
  tooltip: tooltip
}

const views = [
  timeline,
  temporalHeatmap,
  adjacencyMatrix,
  hostDistributionChart,
  actionDistributionChart
];

let testData = {
  "nodes":[
    {"name":"node0"},
    {"name":"node1"},
    {"name":"node2"},
    {"name":"node3"}
  ],
  "links":[
    {"source":"node0","target":"node0","value":5},
    {"source":"node0","target":"node1","value":8},
    {"source":"node0","target":"node2","value":2},
    {"source":"node1","target":"node1","value":18},
    {"source":"node1","target":"node2","value":1},
    {"source":"node3","target":"node3","value":4}
  ]
};


loadExamples();

// Load meta-data for all examples
function loadExamples() {
  d3.json(path + "data/examples_config.json")
      .then(function(data) {
        examplesData = data;
        examplesData.forEach(d => {
          $("#examples-list").append('<li data-log="'+ d.filename +'">'+ d.title +'</li>');
        });
      })
      .catch(function(error) {
        console.log(error); 
      });
}

// Load log data for one example
function selectExample(filename) {
  selectedExample = examplesData.find(d=>d.filename==filename);

  d3.text(path + "data/log/" + selectedExample.filename).then(data => {
    $("#log-input").val(data);
  });

  $("#parser-input").val(selectedExample.parser);
}

// Use shiviz parser to process raw log data into JavaScript object
function parseData() {
  let log = $("#log-input").val();
  let regexpString = $("#parser-input").val();

  let delimiterString = "";
  let delimiter = delimiterString == "" ? null : new NamedRegExp(delimiterString, "m");
  regexpString = regexpString.trim();

  let regexp = new NamedRegExp(regexpString, "m");
  let parser = new LogParser(log, delimiter, regexp);
  
  // Switch tab and show visualization
  UIkit.switcher("#primary-nav .uk-nav").show(1);
  
  // User parser from shiviz
  var labelGraph = {};
  var labels = parser.getLabels();
  parsedLogEvents = parser.getLogEvents("");

  // Check if physical timestamps are given
  app.temporalOrder = (parsedLogEvents[0].fields.date) ? "physical" : "logical";

  graph = new ModelGraph({}, parsedLogEvents);
  logEvents = graph.getNodes();
  
  // Initialize search
  fuse = new Fuse(logEvents, fuseSearchOptions);

  filteredLogEvents = logEvents;
  filteredConnections = graph.getEdges();
  showNumberOfResults();
  updateViews();
};

function filterData() {
  filteredLogEvents = logEvents;
  if(app.filter.tags.length > 0) {
    filteredLogEvents = fuse.search(app.filter.tags.join(" "));
  }
  if(app.filter.time.length > 0) {
    filteredLogEvents = filteredLogEvents.filter(d => {
      return d.fields.time_numeric > app.filter.time[0] && d.fields.time_numeric < app.filter.time[1];
    });
  }
  if(filteredLogEvents.length != logEvents.length) {
    filteredConnections = graph.getFilteredEdges(filteredLogEvents);
  } else {
    filteredConnections = graph.getEdges();
  }

  showNumberOfResults();
  updateSelectionViews();
}


function showNumberOfResults() {
  if(filteredLogEvents.length == logEvents.length) {
    $("#number-of-events").html(logEvents.length + " results");
  } else {
    $("#number-of-events").html("<strong>" + filteredLogEvents.length + " results</strong> (of " + logEvents.length + ")");
  }
}

function updateViews() {
  timeline.data = logEvents;
  timeline.wrangleDataAndUpdateScales();

  updateSelectionViews();
}


function updateSelectionViews() {
  // Draw vis
  temporalHeatmap.data = filteredLogEvents;
  temporalHeatmap.wrangleDataAndUpdateScales();

  adjacencyMatrix.data = filteredLogEvents;
  adjacencyMatrix.wrangleDataAndUpdateScales();

  dag.nodes = filteredLogEvents;
  dag.edges = filteredConnections;
  dag.wrangleDataAndUpdateScales();

  // Count events per host
  let eventsPerHost = d3.nest()
      .key(d => d.host)
      .rollup(v => v.length)
      .entries(filteredLogEvents);

  hostDistributionChart.data = eventsPerHost;
  hostDistributionChart.wrangleDataAndUpdateScales();

  // Count events per action
  if(filteredLogEvents.length > 0 && filteredLogEvents[0].fields.action) {
    $("#action-distribution").fadeIn();
    let eventsPerActionType = d3.nest()
        .key(d => d.fields.action)
        .rollup(v => v.length)
        .entries(filteredLogEvents)
        .sort((a,b) => d3.descending(a.value, b.value));

    actionDistributionChart.data = eventsPerActionType;
    actionDistributionChart.wrangleDataAndUpdateScales();
  } else {
    $("#action-distribution").hide();
  }
}

// Redraw all views (e.g, after window resize)
function redrawViews() {
  views.forEach(view => {
    view.wrangleDataAndUpdateScales();
  });
}


/*
 * Search
 */

let searchSelect = $("#search-input").select2({
  width: "resolve",
  //minimumResultsForSearch: 6,
  dropdownParent: $("#search-input-container"),
  placeholder: "Search ...",
  multiple: true,
  tags: true,
  tokenSeparators: [',', ' '],
  allowClear: true
});

searchSelect.on("change", function() {
  app.filter.tags = $(this).val();
  filterData();
});


/*
 * Event listeners
 */

// Window resize
$(window).resize(function() {
  if(this.resizeTO) clearTimeout(this.resizeTO);
  this.resizeTO = setTimeout(function() {
    $(this).trigger('resizeEnd');
  }, 500);
});

$(window).bind("resizeEnd", function() {
  // Check if visualizations are active
  if($("#main li.uk-active").attr("data-tab") == "vis") {
    redrawViews();
  }
});

// User changed the selected time window 
$(OverviewEventHandler).bind("selectionChanged", function() {
  filterData();
});

// Click on example log
$("ul#examples-list").on("click", "li", function(){
  selectExample($(this).attr("data-log"));
});

// Switch tab and visualize results
$("#visualize").on("click", function() {
  $("#vis-tab").removeClass("uk-hidden");
  parseData();
});

