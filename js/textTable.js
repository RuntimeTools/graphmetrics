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

// divName - the div where this should insert itself.
// parentName - the parent containing everything else on the page/tab
// that should be minimised when this is maximised.
// title - A string title for this text table.
function TextTable(divName, parentName, title) {

  let tableRowHeight = 30;
  let tableRowWidth = 170;
  // TODO - This should probably be a parameter to the constructor
  // or an argument to resizeTable().
  let tableHeight = 250;

  // Define the text chart space
  let svg = d3.select(divName)
  .append('svg')
  .attr('class', 'envData');

  let titleBoxHeight = 30;
  let titleBox = svg.append('rect')
  .attr('height', titleBoxHeight)
  .attr('class', 'titlebox');

  svg.append('text')
  .attr('x', 7)
  .attr('y', 15)
  .attr('dominant-baseline', 'central')
  .style('font-size', '18px')
  .text(title);

  let tableIsFullScreen = false;

  // Add the maximise button
  let resizeImage = svg.append('image')
  .attr('width', 24)
  .attr('height', 24)
  .attr('xlink:href', 'graphmetrics/images/maximize_24_grey.png')
  .attr('class', 'maximize')
  .on('click', function(){
    tableIsFullScreen = !tableIsFullScreen;
    d3.select(parentName).selectAll('.hideable').classed('invisible', tableIsFullScreen);
    d3.select(divName)
    .classed('fullscreen', tableIsFullScreen)
    .classed('invisible', false); // remove invisible from this chart
    if (tableIsFullScreen) {
      resizeImage.attr('xlink:href', 'graphmetrics/images/minimize_24_grey.png');
      // Redraw this chart only
      resizeTable();
    } else {
      resizeImage.attr('xlink:href', 'graphmetrics/images/maximize_24_grey.png');
      // Redraw all
      resize();
    }
  })
  .on('mouseover', function() {
    if (tableIsFullScreen) {
      resizeImage.attr('xlink:href', 'graphmetrics/images/minimize_24.png');
    } else {
      resizeImage.attr('xlink:href', 'graphmetrics/images/maximize_24.png');
    }
  })
  .on('mouseout', function() {
    if (tableIsFullScreen) {
      resizeImage.attr('xlink:href', 'graphmetrics/images/minimize_24_grey.png');
    } else {
      resizeImage.attr('xlink:href', 'graphmetrics/images/maximize_24_grey.png');
    }
  });

  let innerHTML = svg.append('g')
  .append('foreignObject')
  .attr('height', (tableHeight-titleBoxHeight))
  .attr('x', '0')
  .attr('y', titleBoxHeight);
  // .attr('class', 'httpSummaryContent');
  console.log(innerHTML);

  let innerDiv = innerHTML.append('xhtml:body').append('xhtml:div')

  let table = innerDiv.append('xhtml:table')

  function populateTableJSON(requestData) {
    let data = JSON.parse(requestData);
    if (data == null) return;
    // render the table(s)
    tabulate(data); // 2 column table
  }


  function populateTable(data) {
    tabulate(data); // 2 column table
  }

  // Tabulate an array of data in the form:
  // { {Parameter: "param-name", Value: "somevalue"}, {...}}
  function tabulate(tableData) {
    console.log(tableData);
    // clear the table
    table.html('');

    // innerHTML.append('xhtml')
    for (var i = 0; i < tableData.length; i++) {
      let row = table.append('xhtml:tr');
      row.append('xhtml:td').text(tableData[i].Parameter);
      row.append('xhtml:td').text(tableData[i].Value);
    }
    // // create a row for each object in the data
    // let rows = innerHTML.selectAll('text')
    // .data(tableData)
    // .enter()
    // .append('text')
    // .style('font-size', '14px')
    // .attr('transform', function(d, i) {
    //   return 'translate(0,' + (i * tableRowHeight) + ')';
    // });

    // // create a cell in each row for each column
    // rows.selectAll('tspan')
    // .data(function(row) {
    //   return ['Parameter', 'Value'].map(function(column) {
    //     return {column: column, value: row[column]};
    //   });
    // })
    // .enter()
    // .append('tspan')
    // .attr('x', function(d, i) {
    //   return i * tableRowWidth; // indent second element for each row
    // })
    // .text(function(d) { return d.value; });
  }

  function resizeTable() {
    let divCanvasWidth = $(divName).width() - 8; // -8 for margins and borders
    if (tableIsFullScreen) {
      tableHeight = $(divName).height() - 100;
    } else {
      tableHeight = 250;
    }
    resizeImage
    .attr('x', divCanvasWidth - 30)
    .attr('y', 4);
    svg
    .attr('width', divCanvasWidth)
    .attr('height', tableHeight);
    titleBox
    .attr('width', divCanvasWidth);
    innerHTML
    .attr('width', divCanvasWidth)
    .attr('height', tableHeight-titleBoxHeight);
  }

  let exports = {};
  exports.resizeTable = resizeTable;
  exports.populateTableJSON = populateTableJSON;
  exports.populateTable = populateTable;

  return exports;
}
