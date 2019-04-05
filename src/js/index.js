// Webserver path 
//const path = "/ubc/ds/dsvis/";
const path = "";

let examplesData;
let selectedExample;

let temporalHeatmap = new TemporalHeatmap({ parentElement: "#temporal-heatmap"});

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
      //console.log(d.vectorTimestamp);
      console.log("HOST: " + d.host);
      console.log("OWN TIME: " + d.vectorTimestamp.ownTime);
      console.log("VECTOR CLOCK:");
      console.log(d.vectorTimestamp.clock);
    });

    // Draw vis
    temporalHeatmap.data = logEvents;
    temporalHeatmap.wrangleDataAndUpdateScales();
  });
}

// Click on example log
$("ul#examples-list").on("click", "li", function(){
  selectExample($(this).attr("data-log"));
});

$("#visualize").on("click", function(){
  parseData();
});

