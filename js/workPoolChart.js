/*******************************************************************************
 * Copyright 2017 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/

/* exported resizeWorkPoolChart */

// Line chart for displaying event workPool latency

// Width of div allocated for this graph
var workPoolCanvasWidth = $('#workPoolDiv').width() - 8; // -8 for margin and
// border
var workPoolGraphWidth = workPoolCanvasWidth - margin.left - margin.right;

// set up the scales for x and y using the graph's dimensions
var workPool_xScale = d3.time.scale().range([0, workPoolGraphWidth]);
var workPool_yScale = d3.scale.linear().range([graphHeight, 0]);

// data storage
var workPoolData = [];

// set up X axis for time in HH:MM:SS
var workPool_xAxis = d3.svg.axis().scale(workPool_xScale)
    .orient('bottom').ticks(3).tickFormat(getTimeFormat());

// set up Y axis for time in ms
var workPool_yAxis = d3.svg.axis().scale(workPool_yScale)
    .orient('left').ticks(8).tickFormat(function(d) {
      return d + 'items';
    });

// line function for maximum latency
var workPool_max_line = d3.svg.line()
    .x(function(d) {
      return workPool_xScale(d.time);
    })
    .y(function(d) {
      return workPool_yScale(d.latency.max);
    });

// line function for minimum latency
var workPool_min_line = d3.svg.line()
    .x(function(d) {
      return workPool_xScale(d.time);
    })
    .y(function(d) {
      return workPool_yScale(d.latency.min);
    });

// line function for average latency
var workPool_avg_line = d3.svg.line()
    .x(function(d) {
      return workPool_xScale(d.time);
    })
    .y(function(d) {
      return workPool_yScale(d.latency.avg);
    });

var workPoolSVG = d3.select('#workPoolDiv')
    .append('svg')
    .attr('width', workPoolCanvasWidth)
    .attr('height', canvasHeight)
    .attr('class', 'workPoolChart');

var workPoolTitleBox = workPoolSVG.append('rect')
    .attr('width', workPoolCanvasWidth)
    .attr('height', 30)
    .attr('class', 'titlebox');

// define the chart canvas
var workPoolChart = workPoolSVG
    .append('g')
    .attr('transform',
      'translate(' + margin.left + ',' + margin.top + ')');

// Scale the X range to the data's time interval
workPool_xScale.domain(d3.extent(workPoolData, function(d) {
  return d.time;
}));

// Scale the Y range from 0 to the largest maximum latency
workPool_yScale.domain([0, Math.ceil(d3.extent(workPoolData, function(d) {
  return d.latency.max;
})[1] * 1000) / 1000]);

// Draw the max line path.
workPoolChart.append('path')
    .attr('class', 'line1')
    .attr('d', workPool_max_line(workPoolData));

// Draw the min line path.
workPoolChart.append('path')
    .attr('class', 'line2')
    .attr('d', workPool_min_line(workPoolData));

// Draw the avg line path.
workPoolChart.append('path')
    .attr('class', 'line3')
    .attr('d', workPool_avg_line(workPoolData));

// Draw the X Axis
workPoolChart.append('g')
    .attr('class', 'xAxis')
    .attr('transform', 'translate(0,' + graphHeight + ')')
    .call(workPool_xAxis);

// Draw the Y Axis
workPoolChart.append('g')
    .attr('class', 'yAxis')
    .call(workPool_yAxis);

// Draw the title
workPoolChart.append('text')
    .attr('x', 7 - margin.left)
    .attr('y', 15 - margin.top)
    .attr('dominant-baseline', 'central')
    .style('font-size', '18px')
    .text(localizedStrings.workPoolTitle);

// Add the placeholder text
var workPoolChartPlaceholder = workPoolChart.append('text')
    .attr('x', workPoolGraphWidth / 2)
    .attr('y', graphHeight / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '18px')
    .text(localizedStrings.NoDataMessage);

// Add the MAXIMUM colour box
workPoolChart.append('rect')
    .attr('x', 0)
    .attr('y', graphHeight + margin.bottom - 15)
    .attr('class', 'colourbox1')
    .attr('width', 10)
    .attr('height', 10);

// Add the MAXIMUM line label
var workPoolMaxLabel = workPoolChart.append('text')
    .attr('x', 15)
    .attr('y', graphHeight + margin.bottom - 5)
    .attr('text-anchor', 'start')
    .attr('class', 'lineLabel')
    .text(localizedStrings.workPoolMaximumMsg);

// Add the MINIMUM colour box
workPoolChart.append('rect')
    .attr('x', workPoolMaxLabel.node().getBBox().width + 25)
    .attr('y', graphHeight + margin.bottom - 15)
    .attr('width', 10)
    .attr('height', 10)
    .attr('class', 'colourbox2');

// Add the MINIMUM line label
var workPoolMinLabel = workPoolChart.append('text')
    .attr('x', workPoolMaxLabel.node().getBBox().width + 40)
    .attr('y', graphHeight + margin.bottom - 5)
    .attr('class', 'lineLabel')
    .text(localizedStrings.workPoolMinimumMsg);

// Add the AVERAGE colour box
workPoolChart.append('rect')
    .attr('x', workPoolMaxLabel.node().getBBox().width + workPoolMinLabel.node().getBBox().width + 50)
    .attr('y', graphHeight + margin.bottom - 15)
    .attr('width', 10)
    .attr('height', 10)
    .attr('class', 'colourbox3');

// Add the AVERAGE line label
workPoolChart.append('text')
    .attr('x', workPoolMaxLabel.node().getBBox().width + workPoolMinLabel.node().getBBox().width + 65)
    .attr('y', graphHeight + margin.bottom - 5)
    .attr('class', 'lineLabel')
    .text(localizedStrings.workPoolAverageMsg);

// Draw the Latest MAX Data
workPoolChart.append('text')
    .attr('x', 0)
    .attr('y', 0 - (margin.top * 3 / 8))
    .attr('class', 'maxlatest')
    .style('font-size', '32px');

// Draw the Latest MIN Data
workPoolChart.append('text')
    .attr('x', workPoolGraphWidth / 3) // 1/3 across
    .attr('y', 0 - (margin.top * 3 / 8))
    .attr('class', 'minlatest')
    .style('font-size', '32px');

// Draw the Latest AVG Data
workPoolChart.append('text')
    .attr('x', (workPoolGraphWidth / 3) * 2) // 2/3 across
    .attr('y', 0 - (margin.top * 3 / 8))
    .attr('class', 'avglatest')
    .style('font-size', '32px');

var workPoolChartIsFullScreen = false;

// Add the maximise button
var workPoolResize = workPoolSVG.append('image')
    .attr('x', workPoolCanvasWidth - 30)
    .attr('y', 4)
    .attr('width', 24)
    .attr('height', 24)
    .attr('xlink:href', 'graphmetrics/images/maximize_24_grey.png')
    .attr('class', 'maximize')
    .on('click', function(){
      workPoolChartIsFullScreen = !workPoolChartIsFullScreen;
      d3.selectAll('.hideable')
        .classed('invisible', workPoolChartIsFullScreen);
      d3.select('#workPoolDiv')
        .classed('fullscreen', workPoolChartIsFullScreen)
        .classed('invisible', false); // remove invisible from this chart
      if (workPoolChartIsFullScreen) {
        d3.select('.workPoolChart .maximize')
          .attr('xlink:href', 'graphmetrics/images/minimize_24_grey.png');
        // Redraw this chart only
        resizeWorkPoolChart();
      } else {
        d3.select('.workPoolChart .maximize')
          .attr('xlink:href', 'graphmetrics/images/maximize_24_grey.png');
        canvasHeight = 250;
        graphHeight = canvasHeight - margin.top - margin.bottom;
        // Redraw all
        resize();
      }
    })
    .on('mouseover', function() {
      if (workPoolChartIsFullScreen) {
        d3.select('.workPoolChart .maximize')
          .attr('xlink:href', 'graphmetrics/images/minimize_24.png');
      } else {
        d3.select('.workPoolChart .maximize')
          .attr('xlink:href', 'graphmetrics/images/maximize_24.png');
      }
    })
    .on('mouseout', function() {
      if (workPoolChartIsFullScreen) {
        d3.select('.workPoolChart .maximize')
          .attr('xlink:href', 'graphmetrics/images/minimize_24_grey.png');
      } else {
        d3.select('.workPoolChart .maximize')
          .attr('xlink:href', 'graphmetrics/images/maximize_24_grey.png');
      }
    });

function resizeWorkPoolChart() {
  if (workPoolChartIsFullScreen) {
    canvasHeight = $('#workPoolDiv').height() - 100;
    graphHeight = canvasHeight - margin.top - margin.bottom;
  }
  workPoolCanvasWidth = $('#workPoolDiv').width() - 8;
  workPoolGraphWidth = workPoolCanvasWidth - margin.left - margin.right;
  // Redraw placeholder
  workPoolChartPlaceholder
    .attr('x', workPoolGraphWidth / 2)
    .attr('y', graphHeight / 2);
  // Move maximise/minimise button
  workPoolResize
    .attr('x', workPoolCanvasWidth - 30)
    .attr('y', 4);
  // resize the canvas
  var chart = d3.select('.workPoolChart');
  chart
    .attr('width', workPoolCanvasWidth)
    .attr('height', canvasHeight);
  // resize the scale and axes
  workPool_xScale = d3.time.scale().range([0, workPoolGraphWidth]);
  workPool_xAxis = d3.svg.axis()
    .scale(workPool_xScale)
    .orient('bottom')
    .ticks(3)
    .tickFormat(getTimeFormat());
  workPool_yScale = d3.scale.linear().range([graphHeight, 0]);
  workPool_yAxis = d3.svg.axis().scale(workPool_yScale)
    .orient('left')
    .ticks(8)
    .tickFormat(function(d) {
      return d + 'ms';
    });
  workPoolTitleBox
    .attr('width', workPoolCanvasWidth);
  workPool_xScale.domain(d3.extent(workPoolData, function(d) {
    return d.time;
  }));
  workPool_yScale.domain([0, Math.ceil(d3.extent(workPoolData, function(d) {
    return d.latency.max;
  })[1] * 1000) / 1000]);
  // update the data lines
  chart.select('.line1')
    .attr('d', workPool_max_line(workPoolData));
  chart.select('.line2')
    .attr('d', workPool_min_line(workPoolData));
  chart.select('.line3')
    .attr('d', workPool_avg_line(workPoolData));
  // update the axes
  chart.select('.xAxis')
    .attr('transform', 'translate(0,' + graphHeight + ')')
    .call(workPool_xAxis);
  chart.select('.yAxis')
    .call(workPool_yAxis);

  // Move labels
  chart.selectAll('.lineLabel')
    .attr('y', graphHeight + margin.bottom - 5);
  chart.select('.colourbox1')
    .attr('y', graphHeight + margin.bottom - 15);
  chart.select('.colourbox2')
    .attr('y', graphHeight + margin.bottom - 15);
  chart.select('.colourbox3')
    .attr('y', graphHeight + margin.bottom - 15);
}

// eventloop: { time: , latency: { min: , max: , avg: }}
// loop: { count: ,  minimum: , maximum: , average: }
// workPool: { submitted: , completed: , queued: , idle_threads: }
function updateWorkPoolData(workPoolRequest) {
  var workPoolRequestData = JSON.parse(workPoolRequest);  // parses the data into a JSON array
  if (!workPoolRequestData) return;
  var d = workPoolRequestData;
  // XXX data should be timestamped at source, aproximate it here for now.
  d.time = new Date();
  d.latency = {};
  d.latency.min = +d.submitted;
  d.latency.max = +d.completed;
  d.latency.avg = +d.queued;
  // round the latest data to the nearest thousandth
  workPoolData.push(d);

  if (workPoolData.length === 2) {
    // second data point - remove "No Data Available" label
    workPoolChartPlaceholder.attr('visibility', 'hidden');
  }
  // Only keep 'maxTimeWindow' (defined in index.html) milliseconds of data
  var currentTime = Date.now();
  var first = workPoolData[0];
  while (first.hasOwnProperty('time') && first.time + maxTimeWindow < currentTime) {
    workPoolData.shift();
    first = workPoolData[0];
  }
  // Re-scale the X range to the new data time interval
  workPool_xScale.domain(d3.extent(workPoolData, function(d) {
    return d.time;
  }));
  // Re-scale the Y range to the new largest max latency
  workPool_yScale.domain([0, Math.ceil(d3.extent(workPoolData, function(d) {
    return d.latency.max;
  })[1] * 1000) / 1000]);
  workPool_xAxis.tickFormat(getTimeFormat());
  var selection = d3.select('.workPoolChart');
  // update the data lines
  selection.select('.line1')
    .attr('d', workPool_max_line(workPoolData));
  selection.select('.line2')
    .attr('d', workPool_min_line(workPoolData));
  selection.select('.line3')
    .attr('d', workPool_avg_line(workPoolData));
  // update the axes
  selection.select('.xAxis')
    .call(workPool_xAxis);
  selection.select('.yAxis')
    .call(workPool_yAxis);
}
