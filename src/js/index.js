// Webserver path 
//const path = "/ubc/ds/dsvis/";
const path = "";

let examplesData;
let selectedExample;

// All events
let logEvents;

// Events in selected time window
let filteredLogEvents; 

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

let app = {
  offsetTop: 45,
  filter: {
    time: [],
    tags: []
  }
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
  
  // Parser from shiviz
  var labelGraph = {};
  var labels = parser.getLabels();
  //labels.forEach(label => {
  logEvents = parser.getLogEvents("");

  console.log("---- ALL EVENTS: ----");
  console.log(logEvents);
  console.log("**************************************************************************************************");
  console.log("**************************************************************************************************");

  console.log("---- INDIVIDUAL: ----");

  // Check if physical timestamps are given
  app.temporalOrder = (logEvents[0].fields.date) ? "physical" : "logical"

  logEvents.forEach((d,index) => {
    // Convert datetime string to date object
    if(app.temporalOrder == "physical") {
      d.fields.timestamp = moment(d.fields.date).toDate();
      d.fields.time_numeric = d.fields.timestamp.getTime();
    } else {
      d.fields.time_numeric = index;
    }

    //console.log(d.vectorTimestamp);
    //if(d.host == "node1") {
    /*
      console.log("HOST: " + d.host);
      console.log("OWN TIME: " + d.vectorTimestamp.ownTime);
      console.log("VECTOR CLOCK:");
      console.log(d.vectorTimestamp.clock);
      console.log("--");
    }*/
  });

  let hosts = d3.map(logEvents, d => d.host).keys();
  let orderedEvents = [];
  let connections = [];
  let clock = {};


  console.log("**************************************************************************************************");
  console.log("**************************************************************************************************");

  //console.log(getEvents(logEvents));
  

  let events = {};

  logEvents.forEach(d => {
    if (!(d.host in events)) {
      events[d.host] = [];
    }
    events[d.host].push({
      idx: events[d.host].length,
      host: d.host,
      clock: d.vectorTimestamp.clock
      //event: d.event
    })
  })

  // Sort events according to happenBefore relation
  for (let n in events) {
      events[n] = events[n].sort((a, b) => a.clock[n] - b.clock[n]);
      // events[n] = events[n].sort((a, b) => {
      //     if (happenBefore(a.clock, b.clock)) {
      //         return 1;
      //     } else if (happenBefore(b.clock, a.clock)) {
      //         return -1;
      //     } else return a.clock[n] - b.clock[n];
      // });
  }
  //console.log("++++++");
  //console.log(events);
  //console.log("++++++");
  
/*
 logEvents.forEach(function(d, index) {
  console.log(d.host);
  console.log(d.vectorTimestamp.clock);
  console.log(d.pos);
  console.log("---");
 });
*/
  
  // Initialize search
  fuse = new Fuse(logEvents, fuseSearchOptions);

  filteredLogEvents = logEvents;
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

  adjacencyMatrix.data = testData;
  adjacencyMatrix.wrangleDataAndUpdateScales();

  dag.data = filteredLogEvents;
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

// HELPER FUNCTIONS (ONLY TEST; to be decided)
function getDiff(c1, c2) {
  let d = [];
  for (let x in c1) {
      if (!(x in c2) || c1[x] != c2[x]) {
          d.push(x);
      }
  }
  for (let x in c2) {
      if (!(x in c1)) {
          d.push(x);
      }
  }
  return d;
}


// https://github.com/mixu/vectorclock/blob/master/index.js
function compareVT(a, b) {
  var isGreater = false,
      isLess = false;

  // allow this function to be called with objects that contain clocks, or the clocks themselves
  if(a.clock) a = a.clock;
  if(b.clock) b = b.clock;

  allKeys(a, b).forEach(function(key) {
    var diff = (a[key] || 0) - (b[key] || 0);
    if(diff > 0) isGreater = true;
    if(diff < 0) isLess = true;
  });

  if(isGreater && isLess) return 0;
  if(isLess) return -1;
  if(isGreater) return 1;
  return 0; // neither is set, so equal
}

function allKeys(a, b){
  var last = null;
  return Object.keys(a)
    .concat(Object.keys(b))
    .sort()
    .filter(function(item) {
      // to make a set of sorted keys unique, just check that consecutive keys are different
      var isDuplicate = (item == last);
      last = item;
      return !isDuplicate;
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

