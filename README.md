# Vector Vis

Previous approaches to visualize distributed system logs focused mostly on detailed views at the scale of single message traces or short groups of log lines, however, a full distributed log can be as large as a terabyte. While detailed views are quite useful, the problem of deciding which traces, nodes, or time-spans to inspect remains unsolved. We created VectorVis, a tool that enables interactive exploration with coordinated detail and summary views. The premise of the tool is that it is meant as a pre-processing step to filter large log files and output a reduced log to [ShiViz](https://bestchai.bitbucket.io/shiviz/), a sophisticated distributed log visualization tool that focuses on inspecting the “happens-before” relationship. We contribute (1) a task analysis that motivates the major design choices of VectorVis; (2) a detailed description of our design process that articulates design trade-offs and requirements; (3) a prototype that demonstrates key interaction motifs necessary for mediating summary and detail views.

### Run locally

* Start a local webserver (e.g., Python's SimpleHTTPServer or MAMP) and open the project folder

### Develop

* Install npm package manager
* Open the project directory in the command line and run: `npm install`
* node_modules folder will be created automatically
* Run `gulp watch` in the command line to watch JavaScript or CSS changes. Gulp automatically compiles all files to *main.js* and *style.css*
in the */dist* folder.
* If you install new npm modules (e.g., external JS libraries) you have to update *gulpfile.js* and run `gulp`.
