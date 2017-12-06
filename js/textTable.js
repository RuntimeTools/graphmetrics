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
  .attr('height', (tableHeight - titleBoxHeight))
  .attr('x', '0')
  .attr('y', titleBoxHeight);
  let innerDiv = innerHTML.append('xhtml:body').append('xhtml:div');
  let table = innerDiv.append('xhtml:table');

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
    // clear the table
    table.html('');
    for (var i = 0; i < tableData.length; i++) {
      let row = table.append('xhtml:tr');
      row.append('xhtml:td').text(tableData[i].Parameter);
      row.append('xhtml:td').text(tableData[i].Value);
    }
    textOverflow();
  }

  function textOverflow() {
    // Check for any overflowing text
    let tableChildren = $($(table)[0]).find('td');
    // Old way (Everything at once) $('.envData td')
    for (i = 0; i < tableChildren.length; i++) {
      let el = $(tableChildren).get(i);
      // Only check odd numbers in el list (The Value field) Assume all titles are set well
      if (i % 2 == 1) {
        // Math.ceil as sometimes they are .something off being equal
        if ((Math.ceil(el.scrollWidth) > Math.ceil($(el).width()) && (!($(el).hasClass('largeValue'))))) {
          // Text has overflowed
          $(el).addClass('largeValue');
        }
        else if ((Math.ceil(el.scrollWidth) < Math.ceil($(el).width()) && ($(el).hasClass('largeValue')))) {
          $(el).removeClass('largeValue');
        }
        // Now fix text overflow
        if ($(el).hasClass('largeValue')) {
          // Get amount of space available in the div and fill rest of height
          let containerHeight = $(el).closest('foreignObject>body>div').height();
          let table = $(el).closest('table')[0];
          let tableRows = $($(table).children());
          // Get all small text boxes
          let small = $(tableRows).not(':has(.largeValue)');
          let smallHeightTotal = 0;
          $(small).each(function() {
            smallHeightTotal += $(this).height();
          });
          // This is how much space we have left to fill in the container
          let totalHeightLeft = (containerHeight - smallHeightTotal);
          // Get all large text boxes
          let large = $(tableRows).has('.largeValue');
          let amountOfLarge = $(large).length;
          let height = (totalHeightLeft/amountOfLarge);
          $(large).each(function() {
            $(this).height(height);
          });
          let text = $(el).text();
          let html = `<p data-toggle="tooltip" title="${text}">${text}</p>`;
          $(el).html(html);
        }
      }
    }
  }

  function resizeTable() {
    let divCanvasWidth = $(divName).width() - 8; // -8 for margins and borders
    if (tableIsFullScreen) {
      tableHeight = $(divName).height() - 100;
      // If parent is a graph-container (Used to vertically group graphs) make position absolute
      if ($(divName).parent().hasClass('graph-container')) {
        $(divName).parent().attr('style', 'position: absolute');
      }
    } else {
      tableHeight = 250;
      if ($(divName).parent().hasClass('graph-container')) {
        $(divName).parent().attr('style', 'position: relative');
      }
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
    .attr('height', tableHeight - titleBoxHeight);
    textOverflow();
  }

  let exports = {};
  exports.resizeTable = resizeTable;
  exports.populateTableJSON = populateTableJSON;
  exports.populateTable = populateTable;

  return exports;
}
