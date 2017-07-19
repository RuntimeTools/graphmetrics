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

"use strict;"

/* exported resizeProbesChart */

// Line chart for displaying events emitted by users

function UserEventsChart(topic, userDiv) {

  console.log("Graph width: " + httpGraphWidth + " height " + graphHeight);

  // set up the scales for x and y using the graph's dimensions
  let xScale = d3.time.scale().range([0, httpGraphWidth]);
  let yScale = d3.scale.linear().range([graphHeight, 0]);

  // all the data
  let userData = [];
  // names of user events
  // let eventNames = [];
  // data split by user name
  let userDataSeparated = {};

  let colourPalette = ["#00b4a0", "#734098", "#5aaafa", "#ff7832", "#8cd211", "#efc100", "#ff5050", "#6eedd8"];

  let lineLabels = [];

  // Single line function
  let lineFunction = d3.svg.line()
  .x(function(d) {
    console.log("d is: ");
    console.dir(d);
    return xScale(d.time);
  })
  .y(function(d) {
    return yScale(d.duration);
  });

  // set up X axis for time in HH:MM:SS
  let xAxis = d3.svg.axis().scale(xScale)
  .orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));

  // set up Y axis for time in ms
  let yAxis = d3.svg.axis().scale(yScale)
  .orient("left").ticks(8).tickFormat(function(d) {
    return d + "ms";
  });

  let svg = userDiv
  .append("svg")
  .attr("width", httpCanvasWidth)
  .attr("height", canvasHeight)
  .attr("class", "probesChart"); // TODO Create new class

  let titleBox = svg.append("rect")
  .attr("width", httpCanvasWidth)
  .attr("height", 30)
  .attr("class", "titlebox");

  // define the chart canvas
  let chart = svg
  .append("g")
  .attr("transform",
  "translate(" + margin.left + "," + margin.top + ")");

  // Draw the X Axis
  chart.append("g")
  .attr("class", "xAxis")
  .attr("transform", "translate(0," + graphHeight + ")")
  .call(xAxis);

  // Draw the Y Axis
  chart.append("g")
  .attr("class", "yAxis")
  .call(yAxis);

  // Draw the title
  chart.append("text")
  .attr("x", 7 - margin.left)
  .attr("y", 15 - margin.top)
  .attr("dominant-baseline", "central")
  .style("font-size", "18px")
  .text(topic);

  // Add the placeholder text
  let chartPlaceholder = chart.append("text")
  .attr("x", httpGraphWidth / 2)
  .attr("y", graphHeight / 2)
  .attr("text-anchor", "middle")
  .style("font-size", "18px")
  .text("No Data Available");

  function resizeChart() {
    // just doing horizontal resizes for now
    // resize the canvas
    chart.attr("width", httpCanvasWidth);
    // resize the scale and axes
    xScale = d3.time.scale().range([0, httpGraphWidth]);
    xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .ticks(3);

    titleBox.attr("width", httpCanvasWidth);

    // Update the input domain
    xScale.domain(d3.extent(data, function(d) {
      return d.time;
    }));

    chart.selectAll("circle").remove();

    // update the data lines
    let i = 0;
    for (let eventName in userDataSeparated ) {
      let lineName = ".line" + (i + 1);
      selection.select(lineName)
      .attr("d", lineFunction(userDataSeparated[eventName]));

      // Add the points
      selection.selectAll("point" + (i + 1))
      .data(userDataSeparated[eventName])
      .enter().append("circle")
      .attr("r", 4)
      .style("fill", colourPalette[i])
      .style("stroke", "white")
      .attr("transform",
      "translate(" + margin.left + "," + margin.top + ")")
      .attr("cx", function(d) { return xScale(d.time); })
      .attr("cy", function(d) { return yScale(d.duration); });
      // .append("svg:title").text(function(d) { return d.url; }); // tooltip
      i++;
    }

    // update the axes
    chart.select(".xAxis")
    .call(xAxis);
    chart.select(".yAxis")
    .call(yAxis);
  }

  function createUserEventHandler(topic) {

    return function(payload) {

      let data = JSON.parse(payload);  // parses the data into a JSON array
      if (!data || data.length === 0) return;

      console.log("Parsing: " + payload);
      console.log("userDataSeparated is:");
      console.dir(userDataSeparated);


      // Block bad data, until we have more generic graphs.
      if( !( data.hasOwnProperty("time") && data.hasOwnProperty("duration")) ) {
        return;
      }
      // Convert data from strings to numbers
      data.time = +data.time;
      data.duration = +data.duration;

      // TODO Turn this into a proper d3 graph, I have no idea WTF the
      // stuff below is really trying to do.

      console.log("Data from message is:");
      console.dir(data);

      if (userData.length === 0) {
        // first data - remove "No Data Available" label
        chartPlaceholder.attr("visibility", "hidden");
      }

      // if(data.length >= maxDataPoints) {
      // empty arrays
      //    probesData = [];
      //    for (let i= 0; i< topicCount; i++) {
      //        userDataSeparated[i] = [];
      //    }
      // }

      // for (let i = 0; i < data.length; i++) {
        userData.push(data);
        let found = false;
        if (userDataSeparated[topic]) {
          found = true;
          userDataSeparated[topic].push(data);
        }
        if (!found) { // new type of event
          userDataSeparated[topic] = [];
          userDataSeparated[topic].push(data);

          let topicCount = Object.keys(userDataSeparated).length;

          console.log(`topicCount ${topicCount}`);

          // add a new line
          chart.append("path")
          .attr("class", "line" + topicCount)
          .style("stroke", colourPalette[topicCount - 1])
          .style("stroke-width", "2px")
          .style("fill", "none");

          // Add the colour box
          chart.append("rect")
          .attr("x", (topicCount - 1) * 100)
          .attr("y", graphHeight + margin.bottom - 15)
          .attr("width", 10)
          .attr("height", 10)
          .attr("class", "colourbox1")
          .style("fill", colourPalette[topicCount - 1]);

          // Add the labels
          lineLabels[topicCount - 1] = chart.append("text")
          .attr("x", 15 + (topicCount - 1) * 100)
          .attr("y", graphHeight + margin.bottom - 5)
          .attr("text-anchor", "start")
          .attr("class", "lineLabel1")
          .text(topic);
        }
      // }

      // Only keep 'maxTimeWindow' milliseconds of data
      let currentTime = Date.now();
      let cutoffTime = currentTime - maxTimeWindow;
      let d = userData[0];
      console.log("d is: ");
      console.dir(d);
      while (d.hasOwnProperty("time") && d.time < cutoffTime) {
        userData.shift();
        d = userData[0];
      }
      //  while (probesData.length > maxDataPoints) {
      //      let d1 = probesData[0]
      //      if(d1.hasOwnProperty('time'))
      //         cutoffTime = d1.time
      //     probesData.shift()
      //  }
      // for (i = 0; i < topicCount; i++) {
      //   let oneEventData = userDataSeparated[i];
      //   console.dir(oneEventData);
      //   console.log("oneEventData is:");
      //   let d1 = oneEventData[0];
      //   while (d1.hasOwnProperty("time") && d1.time <= cutoffTime) {
      //     oneEventData.shift();
      //     d1 = oneEventData[0];
      //     console.log("d1 is:");
      //     console.dir(d1);
      //   }
      // }

      // Set the input domain for both axes
      console.log("Scaling off:");
      console.dir(userData);
      xScale.domain(d3.extent(userData, function(d) {
        return d.time;
      }));
      yScale.domain([0, Math.ceil(d3.extent(userData, function(d) {
        return d.duration;
      })[1])]);

      //let selection = d3.select(".chart");
      chart.selectAll("circle").remove();

      // update the data lines
      let i = 0;
      for (let eventName in userDataSeparated ) {
        console.log("Plotting line for: " + eventName);
        let lineName = ".line" + (i + 1);
        console.log("userDataSeparated[eventName]:");
        console.dir(userDataSeparated[eventName]);

        chart.select(lineName)
          .attr("d", lineFunction(userDataSeparated[eventName]));

        // Add the points
        chart.selectAll("point" + (i + 1))
        .data(userDataSeparated[eventName])
        .enter().append("circle")
        .attr("r", 4)
        .style("fill", colourPalette[i])
        .style("stroke", "white")
        .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")")
        .attr("cx", function(d) { console.log("d.time is: "); console.dir(d.time); let ret =  xScale(d.time); console.log("ret is: " + ret); return ret;})
        .attr("cy", function(d) { return yScale(d.duration); })
        .append("svg:title").text(function(d) { return d.total + " events"; }); // tooltip

        i++;
      }
      // update the axes
      chart.select(".xAxis")
        .call(xAxis);
      chart.select(".yAxis")
        .call(yAxis);
    };
  }

  exports = {};
  exports.resizeChart = resizeChart;
  exports.addDataHandler = createUserEventHandler;
  return exports;

  //updateProbesData();
};
