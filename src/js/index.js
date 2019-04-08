// Webserver path 
//const path = "/ubc/ds/dsvis/";
const path = "";

let examplesData;
let selectedExample;

let temporalHeatmap = new TemporalHeatmap({ parentElement: "#temporal-heatmap" });
let adjacencyMatrix = new AdjacencyMatrix({ parentElement: "#adjacency-matrix" });
let hostDistributionChart = new BarChart({ parentElement: "#host-distribution", y:"key", x:"value" });
let actionDistributionChart = new BarChart({ parentElement: "#action-distribution", y:"key", x:"value" });
let timeline = new Timeline({ parentElement: "#timeline" });


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
  labels.forEach(label => {
    var logEvents = parser.getLogEvents(label);

    console.log("---- ALL EVENTS: ----");
    console.log(logEvents);
    console.log("**************************************************************************************************");
    console.log("**************************************************************************************************");

    console.log("---- INDIVIDUAL: ----");
    logEvents.forEach(function(d) {
      // Convert datetime string to date object
      if(d.fields.date) {
        d.fields.timestamp = moment(d.fields.date).toDate();
        d.fields.time_numeric = d.fields.timestamp.getTime();
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
    let hostPos = {};
    let clock = {};

    hosts.forEach(d => {
      hostPos[d] = 0;
    });

    console.log("**************************************************************************************************");
    console.log("**************************************************************************************************");

    //console.log(getEvents(logEvents));

    //let orderedEvents = [];
    logEvents.forEach(function(d, index) {
      let currVT = d.vectorTimestamp;
      clock[d.host] = currVT.ownTime;

      if(index > 0) {
        console.log(logEvents[index-1].vectorTimestamp.clock);
        console.log(d.host);
        console.log(currVT.clock);
        console.log(compareVT(logEvents[index-1].vectorTimestamp, currVT));
        console.log("-----");


        if(d.host != logEvents[index-1].host) { // host switch
          if(compareVT(logEvents[index-1].vectorTimestamp, currVT) == -1) { // a < b
            hostPos[d.host] = logEvents[index-1].pos + 1;
          } else {
            hostPos[d.host]++;
          }
          //if(== undefined)
          //
          
          /*
          //console.log(logEvents[index-1].vectorTimestamp.compareTo(currVT));
          console.log(d.host);
          console.log(compareVT(logEvents[index-1].vectorTimestamp, currVT));
          console.log(getDiff(currVT.clock, logEvents[index-1].vectorTimestamp.clock));
          console.log(logEvents[index-1].vectorTimestamp.clock);
          console.log(currVT.clock);
          console.log("---");
          */
        } else {
          hostPos[d.host]++;
        }
      } else {
        hostPos[d.host]++;
      }
      
      d.pos = hostPos[d.host];

      /*
      for (var otherHost in currVT.clock) {
        var time = currVT.clock[otherHost];
        if (clock[otherHost] < time) {
          clock[otherHost] = time;
        }
      }*/
    });
/*
   logEvents.forEach(function(d, index) {
    console.log(d.host);
    console.log(d.vectorTimestamp.clock);
    console.log(d.pos);
    console.log("---");
   });
*/

    // Draw vis
    temporalHeatmap.data = logEvents;
    temporalHeatmap.wrangleDataAndUpdateScales();

    adjacencyMatrix.data = testData;
    adjacencyMatrix.wrangleDataAndUpdateScales();

    // Show timeline if date field is available
    if(logEvents[0].fields.timestamp) {
      timeline.data = logEvents;
      timeline.wrangleDataAndUpdateScales();
    }

    // Count events per host
    let eventsPerHost = d3.nest()
        .key(d => d.host)
        .rollup(v => v.length)
        .entries(logEvents);

    hostDistributionChart.data = eventsPerHost;
    hostDistributionChart.wrangleDataAndUpdateScales();


    // Count events per action
    if(logEvents[0].fields.action) {
      let eventsPerActionType = d3.nest()
          .key(d => d.fields.action)
          .rollup(v => v.length)
          .entries(logEvents)
          .sort((a,b) => d3.descending(a.value, b.value));

      actionDistributionChart.data = eventsPerActionType;
      actionDistributionChart.wrangleDataAndUpdateScales();
    }
  });
}

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

// Click on example log
$("ul#examples-list").on("click", "li", function(){
  selectExample($(this).attr("data-log"));
});

$("#visualize").on("click", function(){
  parseData();
});

