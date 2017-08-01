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

"use strict";

// This holds all tree nodes as an array so we can
// easily pass them to d3.
// This should only be cleared if we start a different profile.
let all_tree_nodes = [];

// Constructor, creates a TreeNode from a profile node.
function TreeNode(name, file, line, parent_ref = undefined) {
  this.count = 0;
  this.child_count = 0;
  if (parent_ref) {
    this.parent_ref = parent_ref;
    parent_ref.children.push(this);
  } else {
    this.parent_ref = undefined;
  }
  this.children = [];
  this.file = file;
  this.name = name;
  this.line = line;
  this.colour = colours[0];
  this.width = 0;
  this.height = 0;
  this.x_pos = 0;
  this.y_pos = 0;
  this.addTicks = function(ticks) {
    this.count += ticks;
    let next_parent = this.parent_ref;
    while (next_parent) {
      next_parent.child_count += ticks;
      next_parent = next_parent.parent_ref;
    }
  };
  all_tree_nodes.push(this);
}

// Walk the nodes as a tree to work out plot
// sizes.
function updateNodeAndChildren(current_node, width, x_pos = 0, depth = 0) {
  current_node.width = width;
  current_node.height = flamegraphBoxHeight;
  current_node.depth = depth;
  current_node.x_pos = x_pos;
  current_node.y_pos = depth * flamegraphBoxHeight;

  // Stack the children in the middle of the parent.
  let cumulative_count = current_node.child_count + current_node.count;
  let alignment = 0;
  if (cumulative_count > 0) {
    alignment = ((current_node.count / cumulative_count) * width) / 2;
  }

  let child_x_pos = x_pos + alignment;

  for (let child_node of current_node.children) {
   // Width of the child is the fraction of the current width they should occupy.
    let child_width = 0;
    if (cumulative_count > 0) {
      child_width = width * ((child_node.count + child_node.child_count) / cumulative_count);
    }

    updateNodeAndChildren(child_node, child_width, child_x_pos, depth + 1);
    child_x_pos = child_x_pos + child_width;
  }
}

// Four colours should be enough, more might be prettier though.
// let colours = ["red", "orange", "pink", "blue"];
let colours = ["coral", "tomato", "orangered", "gold", "orange", "darkorange"];

 // Put colour_index outside the update function so we don't reuse the
 // first few over and over again and use the whole set instead.
let colour_index = 0;

function setColours() {
  let nodes_by_depth = [];
  all_tree_nodes.forEach(node => {
    let row = nodes_by_depth[node.depth] || [];
    row.push(node);
    nodes_by_depth[node.depth] = row;
  })
  nodes_by_depth.forEach(row => {
    row.sort( (a,b) => (a.x_pos - b.x_pos));
  });

  function nextColour(parent_colour) {
    colour_index++;
    colour_index = colour_index % colours.length;
    return colours[colour_index];
  }

  // Don't bother setting a colour for the root node.
  nodes_by_depth.slice(1).forEach( row => {
    row.forEach( node => {
      // Hopefully we have more than two colours!
      node.colour = nextColour();
      if( node.colour == node.parent_ref.colour ) {
        node.colour = nextColour();
      }
    });
  });
}

let currentSelection = null;

function drawFlameGraph(function_calls) {

  setColours();

  // Iterate through the array of data and draw each
  // function call's box.

  svg.selectAll("rect").remove();

  let rectSelection = svg.selectAll("rect")
      .data(function_calls);

  // Only update x and width on update, labels never change.
  // rectSelection
  //   .attr("x", (d, i) => {if( isNaN(d.x_pos) ) { console.error("NaN x_pos for " + d.name) } else { return d.x_pos}})
  //   .attr("width", (d,i) => {if( isNaN(d.width) ) { console.error("NaN width for " + d.name) } else {return d.width}});

  // Set the colour, height and y position for new entries.
  rectSelection
    .enter()
    .append("rect")
    .attr("x", (d, i) => { if (isNaN(d.x_pos)) { console.error("NaN x_pos for " + d.name); } else { return d.x_pos; } })
    .attr("y", (d, i) => (flamegraphCanvasHeight - d.height) - d.y_pos)
    .attr("width", (d, i) => { if (isNaN(d.width)) { console.error("NaN width for " + d.name); } else { return d.width; } })
    .attr("height", (d, i) => d.height)
    .attr("label", (d, i) => d.name)
    .style("fill", (d, i) => d.colour)
    .on("click", function(d, i) {
      // De-select the current selection and select the new one.
      if (currentSelection) {
        d3.select(currentSelection)
        .style("stroke-width", 0)
        .style("stroke", "rgb(0,0,0)");
      }
      d3.select(this)
        .style("stroke-width", 3)
        .style("stroke", "rgb(0,0,0)");
      currentSelection = this;
      selectNode(d);
    })
    .append("title").text((d, i) => createStack(d));

  // Add text labels to each box.
  // let textSelection = svg.selectAll("text")
  //   .data(function_calls);
  //
  // // Only update x and width on update, labels never change.
  // textSelection
  //   .attr("x", (d, i) => {if( isNaN(d.x_pos) ) { console.error("NaN x_pos for " + d.name) } else { return d.x_pos}})
  //   .attr("width", (d, i) => {if( isNaN(d.width) ) { console.error("NaN width for " + d.name) } else {return d.width}})
  //
  // textSelection
  //   .enter()
  //   .append("text")
  //   .attr("x", (d, i) => {if( isNaN(d.x_pos) ) { console.error("NaN x_pos for " + d.name) } else { return d.x_pos}})
  //   .attr("y", (d, i) => (flamegraphCanvasHeight - (d.height/2)) - d.y_pos)
  //   .attr("width", (d, i) => {if( isNaN(d.width) ) { console.error("NaN width for " + d.name) } else {return d.width}})
  //   .attr("height", (d, i) => d.height)
  //   .text((d, i)=> d.name)
  //   .attr("fill", "black");
  //   // .style("stroke-width", 3)
  //   // .style("stroke", "rgb(0,0,0)");

}

function selectNode(node) {
  detailsText.selectAll("tspan").remove();
  let stack = "";
  let current_node = node;

  while (current_node) {
    // Trim off node_modules path if exists.
    let fileName = current_node.file.split("node_modules/").pop();
    let functionName = current_node.name == "" ? "<anonymous function>" : current_node.name;
    detailsText
      .append("tspan")
      .attr("x", 0)
      .attr("dy", 20) // TODO - Set this to the text height.
      .text(`${functionName} (${fileName}:${current_node.line})`);
    current_node = current_node.parent_ref;
  }
  return stack;
}

function clearSelection() {
  detailsText.selectAll("tspan").remove();
  detailsText.append("tspan")
    .text(object.flamegraphDetailsMsg);
}

function clearFlameGraph() {
  all_tree_nodes = [];
  clearSelection();
}

function createStack(node) {
  let stack = "";
  let current_node = node;
  while (current_node) {
    stack += current_node.name == "" ? "<anonymous function>" : current_node.name;
    stack += "\n";
    current_node = current_node.parent_ref;
  }
  return stack;
}

let flamegraphCanvasWidth;
let flamegraphProfileWidth;
let flamegraphCanvasHeight;
let flamegraphBoxHeight;

function refreshFlameGraph() {
  // The first node should always be the root node.
  updateNodeAndChildren(all_tree_nodes[0], flamegraphCanvasWidth);
  drawFlameGraph(all_tree_nodes);
}

let svg = window.d3.select("#flameDiv")
  .append("svg")
  .attr("class", "flameGraph")
  .attr("width", flamegraphCanvasWidth)
  .attr("height", flamegraphCanvasHeight);

// Create a details pane the same size as the flamegraph.
let details = window.d3.select("#flameDiv")
    .append("svg")
    .attr("class", "callStack")
    .attr("width", flamegraphProfileWidth)
    .attr("height", flamegraphCanvasHeight);

let detailsTitleBox = details.append("rect")
    .attr("width", "100%")
    .attr("height", 30)
    .attr("class", "titlebox");

// Draw the title
details.append("text")
  .attr("x", 0)
  .attr("y", 15)
  .attr("dominant-baseline", "central")
  .style("font-size", "18px")
  .text(object.flamegraphCallStackTitle);

// Add the placeholder text
let detailsText = details.append("text")
  .attr("x", 0)
  .attr("y", 50)
  .attr("width", "100%")
  .attr("height", flamegraphCanvasHeight - 50)
  .attr("text-anchor", "left")
  .style("font-size", "18px")
  .style("font-family", "monospace");


clearSelection();

function resizeFlameGraph() {

  let profilingTabWidth = $("#flameDiv").width() - 8;
  flamegraphCanvasWidth = profilingTabWidth * 0.6;
  flamegraphProfileWidth = profilingTabWidth * 0.35; // Leave 0.05 for padding.
  flamegraphCanvasHeight = window.innerHeight - 120;
  flamegraphBoxHeight = 20;

  svg.attr("width", flamegraphCanvasWidth)
    .attr("height", flamegraphCanvasHeight);

  details.attr("width", flamegraphProfileWidth)
    .attr("height", flamegraphCanvasHeight);

  detailsText.attr("height", flamegraphCanvasHeight - 50);

}
