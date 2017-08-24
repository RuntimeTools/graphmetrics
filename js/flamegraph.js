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

'use strict';

// This holds all tree nodes as an array so we can
// easily pass them to d3.
// This should only be cleared if we start a different profile.
let all_tree_nodes = [];
let max_depth = 0;

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
  this.selected = false;
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

  max_depth = Math.max(max_depth, current_node.depth);

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
const colours = ['coral', 'tomato', 'orangered', 'gold', 'orange', 'darkorange'];

function setColours() {

  let colour_index = 0;
  let nodes_by_depth = [];

  all_tree_nodes.forEach(node => {
    let row = nodes_by_depth[node.depth] || [];
    row.push(node);
    nodes_by_depth[node.depth] = row;
  });
  nodes_by_depth.forEach(row => {
    row.sort((a, b) => (a.x_pos - b.x_pos));
  });

  function nextColour() {
    colour_index++;
    colour_index = colour_index % colours.length;
    return colours[colour_index];
  }

  // Don't bother setting a colour for the root node.
  nodes_by_depth.slice(1).forEach(row => {
    row.forEach(node => {
      // Hopefully we have more than two colours!
      node.colour = nextColour();
      if (node.colour == node.parent_ref.colour) {
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

  svg.selectAll('rect').remove();

  let rectSelection = svg.selectAll('rect')
      .data(function_calls);

  // Set the colour, height and y position for new entries.
  rectSelection
    .enter()
    .append('rect')
    .attr('x', (d, _i) => {
      if (isNaN(d.x_pos)) {
        console.error('NaN x_pos for ' + d.name);
      } else {
        return d.x_pos;
      }
    })
    .attr('y', (d, _i) => (flamegraphCanvasHeight - d.height) - d.y_pos)
    .attr('width', (d, _i) => {
      if (isNaN(d.width)) {
        console.error('NaN width for ' + d.name);
      } else {
        return d.width;
      }
    })
    .attr('height', (d, _i) => d.height)
    .attr('label', (d, _i) => d.name)
    .style('fill', (d, _i) => d.colour)
    .style('stroke', 'rgb(0,0,0)')
    .on('click', function(d, _i) {
      currentSelection = d;
      selectNode(d);
      highlightSelectedNode();
    })
    .append('title').text((d, _i) => createStack(d));

  highlightSelectedNode();
}


function highlightSelectedNode() {
  // Set the highlighting and make the selected element the last to be
  // drawn to stop the border being covered on some edges by other rectangles.
  d3.selectAll('rect')
  .style('stroke-width', (d, _i) => d == currentSelection ? 3 : 1)
  .each(function(d, _i) {
    if (d == currentSelection) {
      this.parentElement.appendChild(this);
    }
  });
}

function selectNode(node) {
  detailsText.selectAll('tspan').remove();
  let stack = '';
  let current_node = node;

  while (current_node) {
    // Trim off node_modules path if exists.
    let fileName = current_node.file.split('node_modules/').pop();
    let functionName = current_node.name == '' ? '<anonymous function>' : current_node.name;
    detailsText
      .append('tspan')
      .attr('x', 0)
      .attr('dy', 20) // TODO - Set this to the text height.
      .text(`${functionName} (${fileName}:${current_node.line})`);
    current_node = current_node.parent_ref;
  }
  return stack;
}

function clearSelection() {
  detailsText.selectAll('tspan').remove();
  detailsText.append('tspan')
    .text(localizedStrings.flamegraphDetailsMsg);
}

function clearFlameGraph() {
  all_tree_nodes = [];
  max_depth = 0;
  clearSelection();
  refreshFlameGraph();
}

function createStack(node) {
  let stack = '';
  let current_node = node;
  while (current_node) {
    stack += current_node.name == '' ? '<anonymous function>' : current_node.name;
    stack += '\n';
    current_node = current_node.parent_ref;
  }
  return stack;
}

let flamegraphCanvasWidth;
let flamegraphProfileWidth;
let flamegraphMinCanvasHeight;
let flamegraphCanvasHeight;
let flamegraphBoxHeight;

function resizeFlameGraph() {

  // Make sure the width isn't < 0 when the tab isn't shown.
  let profilingTabWidth = Math.max(0, $('#flameDiv').width() - 8);
  flamegraphCanvasWidth = profilingTabWidth * 0.6;
  flamegraphProfileWidth = profilingTabWidth * 0.35; // Leave 0.05 for padding.
  flamegraphMinCanvasHeight = window.innerHeight - 120;
  flamegraphBoxHeight = 20;

  var heightNeeded = max_depth * flamegraphBoxHeight;
  if (heightNeeded > flamegraphMinCanvasHeight) {
    flamegraphCanvasHeight = heightNeeded;
  } else {
    flamegraphCanvasHeight = flamegraphMinCanvasHeight;
  }

  svg.attr('width', flamegraphCanvasWidth)
    .attr('height', flamegraphCanvasHeight);

  details.attr('width', flamegraphProfileWidth)
    .attr('height', flamegraphCanvasHeight);

  detailsText.attr('height', flamegraphCanvasHeight - 50);

}

function refreshFlameGraph() {

  resizeFlameGraph();

  // The first node should always be the root node.
  if (all_tree_nodes.length > 0) {
    updateNodeAndChildren(all_tree_nodes[0], flamegraphCanvasWidth);
    // Resize as the height may have changed with new nodes.

  }
  drawFlameGraph(all_tree_nodes);
}

/** Initialise Flame Graph **/

let svg = window.d3.select('#flameDiv')
  .append('svg')
  .attr('class', 'flameGraph');

// Create a details pane the same size as the flamegraph.
let details = window.d3.select('#flameDiv')
    .append('svg')
    .attr('class', 'callStack');

// Draw the title box
details.append('rect')
    .attr('width', '100%')
    .attr('height', 30)
    .attr('class', 'titlebox');

// Draw the title
details.append('text')
  .attr('x', 0)
  .attr('y', 15)
  .attr('dominant-baseline', 'central')
  .style('font-size', '18px')
  .text(localizedStrings.flamegraphCallStackTitle);

// Add the placeholder text
let detailsText = details.append('text')
  .attr('x', 0)
  .attr('y', 50)
  .attr('width', '100%')
  .attr('text-anchor', 'left')
  .style('font-size', '18px')
  .style('font-family', 'monospace');


clearSelection();
refreshFlameGraph();
