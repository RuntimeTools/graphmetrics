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
function MysqlSummary(divName, parentName, title) {
  let mysqlData = [];
  let height = 250;
  let minHeight = height;

  // Functions that don't need to be in the httpSummary object
  function fillScreenHeight(minHeight) {
    // Set height to the rest of the page
    let body = document.getElementsByTagName('BODY')[0].offsetHeight;
    let nav = document.getElementsByClassName('nav')[0].offsetHeight;
    let header = document.getElementsByClassName('headerDiv')[0].offsetHeight;
    let height = body - (nav + header) - 20;
    if (height < minHeight) {
      return minHeight;
    }
    return height;
  }

  function calculateTableHeight() {
    // TODO - This should probably be a parameter to the constructor
    // or an argument to resizeTable().
    height = 250;
    // If the div has class of 'height-2' (Double height div) change tableHeight
    if ($(divName).hasClass('height-2')) {
      // TODO - This should be dynamic, at the moment it isn't
      // as other heights are not dynamic either
      height = 510;
    } else if ($(divName).hasClass('height-fill')) {
      minHeight = 510; // Height of two divs - needs to be dynamic when above is
      height = fillScreenHeight(minHeight);
    }
    return height;
  }


  const normalTableHeight = calculateTableHeight();
  let tableHeight = normalTableHeight;

  // -8 for margin and border, min 100 in case this is on a hidden tab.
  let canvasWidth = Math.max($(divName).width() - 8, 100);
  let graphWidth = canvasWidth - margin.left - margin.right;
  let graphHeight = tableHeight - margin.top - margin.bottom;

  let mysqlSummarySVG = d3.select(divName)
  .append('svg')
  .attr('class', 'mysqlSummaryChart');

  // Set titleBoxHeight here as we use it for the graph div below
  let titleBoxHeight = 30;
  let mysqlSummaryTitleBox = mysqlSummarySVG.append('rect')
  .attr('height', titleBoxHeight)
  .attr('class', 'titlebox');

  let mysqlSummaryChart = mysqlSummarySVG.append('g')
  .attr('transform',
  'translate(' + margin.left + ',' + margin.top + ')');

  // Add the title
  mysqlSummaryChart.append('text')
  .attr('x', 7 - margin.left)
  .attr('y', 15 - margin.top)
  .attr('dominant-baseline', 'central')
  .style('font-size', '18px')
  .text(title);

  // Add the placeholder text
  let mysqlSummaryChartPlaceholder = mysqlSummaryChart.append('text')
  .attr('text-anchor', 'middle')
  .style('font-size', '18px')
  .text(localizedStrings.NoDataMsg);

  let mysqlSummaryIsFullScreen = false;

  // Add the maximise button
  let summaryResize = mysqlSummarySVG.append('image')
  .attr('width', 24)
  .attr('height', 24)
  .attr('xlink:href', 'graphmetrics/images/maximize_24_grey.png')
  .attr('class', 'maximize')
  .on('click', function(){
    mysqlSummaryIsFullScreen = !mysqlSummaryIsFullScreen;
    d3.select(parentName).selectAll('.hideable').classed('invisible', mysqlSummaryIsFullScreen);
    d3.select(divName)
    .classed('fullscreen', mysqlSummaryIsFullScreen)
    .classed('invisible', false); // remove invisible from this chart
    if (mysqlSummaryIsFullScreen) {
      summaryResize.attr('xlink:href', 'graphmetrics/images/minimize_24_grey.png');
      // Redraw this chart only
      resizeTable();
    } else {
      canvasWidth = $(divName).width() - 8; // -8 for margins and borders
      graphWidth = canvasWidth - margin.left - margin.right;
      summaryResize.attr('xlink:href', 'graphmetrics/images/maximize_24_grey.png');
      tableHeight = normalTableHeight;
      $(divName).parent().attr('style', 'position: relative');
      graphHeight = tableHeight - margin.top - margin.bottom;
      // Redraw all
      resize();
    }
  })
  .on('mouseover', function() {
    if (mysqlSummaryIsFullScreen) {
      summaryResize.attr('xlink:href', 'graphmetrics/images/minimize_24.png');
    } else {
      summaryResize.attr('xlink:href', 'graphmetrics/images/maximize_24.png');
    }
  })
  .on('mouseout', function() {
    if (mysqlSummaryIsFullScreen) {
      summaryResize.attr('xlink:href', 'graphmetrics/images/minimize_24_grey.png');
    } else {
      summaryResize.attr('xlink:href', 'graphmetrics/images/maximize_24_grey.png');
    }
  });

  // Attempt to add foreign object to http summary for list
  // summarydiv
  let mysqlSummaryContent = mysqlSummarySVG.append('foreignObject')
  .attr('width', graphWidth)
  .attr('height', (tableHeight - titleBoxHeight))
  .attr('x', '0')
  .attr('y', titleBoxHeight)
  .attr('class', 'mysqlSummaryContent');

  let mysqlSummaryDiv = mysqlSummaryContent
  .append('xhtml:body')
  .append('xhtml:div')
  .attr('class', 'mysqlSummaryDiv');

  let mysqlSummaryTableTitles = mysqlSummaryDiv.append('xhtml:div')
  .attr('class', 'mysqlSummaryTableHeaderDiv')
  .append('xhtml:table');

  // Set titles for table
  let mysqlSummaryTableTitlesRow = mysqlSummaryTableTitles.append('xhtml:tr');
  mysqlSummaryTableTitlesRow.append('xhtml:td').attr('class', 'mysqlSummaryTableHeader active')
    .text('Query').attr('id', 'url');
  mysqlSummaryTableTitlesRow.append('xhtml:td').attr('class', 'mysqlSummaryTableHeader')
    .text('Duration').attr('id', 'hits').append('xhtml:span');

  let mysqlSummaryContentDivHeight = tableHeight - (40 + titleBoxHeight + $('.mysqlSummaryTableHeaderDiv').height());
  let mysqlSummaryContentDiv = mysqlSummaryDiv.append('xhtml:div')
  .attr('class', 'mysqlSummaryContentDiv')
  .attr('cellspacing', '0')
  .attr('cellpadding', '0')
  .attr('style', 'height: ' + mysqlSummaryContentDivHeight + 'px');

  let mysqlSummaryContentTable = mysqlSummaryContentDiv.append('xhtml:table');

  function updateChart() {
    mysqlSummaryContentTable.html('');
    for (var i = mysqlData.length - 1; i >= 0; i--) {
      let innerQuery = mysqlData[i].query;
      if (innerQuery.indexOf('{"sql":"') === 0){
        innerQuery = JSON.parse(innerQuery);
        innerQuery = innerQuery.sql;
      }
      let row = mysqlSummaryContentTable.append('xhtml:tr');
      row.append('xhtml:td').text(innerQuery).on('click', function(){
        alert(innerQuery);
      });
      row.append('xhtml:td').text(Number(mysqlData[i].duration).toFixed(2));
    }
  }

  function updateData(data) {
    mysqlData = JSON.parse(data);
    updateChart();
  }

  function resizeTable() {
    if (mysqlSummaryIsFullScreen) {
      // Make sure that the height doesn't change if its already full
      if (!($(divName).hasClass('height-fill'))) {
        tableHeight = $(divName).height() - 100;
        if ($(divName).hasClass('height-2')) {
          $(divName).parent().attr('style', 'position: absolute');
        }
      }
    }
    if ($(divName).hasClass('height-fill')) {
      tableHeight = fillScreenHeight(minHeight);
    }
    canvasWidth = Math.max($(divName).width() - 8, 100);
    graphWidth = canvasWidth - margin.left - margin.right;
    summaryResize
      .attr('x', canvasWidth - 30)
      .attr('y', 4);
    mysqlSummaryChartPlaceholder
      .attr('x', graphWidth / 2)
      .attr('y', graphHeight / 2);
    mysqlSummarySVG
      .attr('width', canvasWidth)
      .attr('height', tableHeight);
    mysqlSummaryTitleBox
      .attr('width', canvasWidth);
    mysqlSummaryContent
      .attr('width', canvasWidth)
      .attr('height', (tableHeight - titleBoxHeight));
    mysqlSummaryContentDivHeight = tableHeight - (40 + titleBoxHeight + $('.mysqlSummaryTableHeaderDiv').height());
    mysqlSummaryContentDiv
      .attr('style', 'height: ' + mysqlSummaryContentDivHeight + 'px');
    scrollBarCorrection();
  }

  // Correct the size of the table titles
  // by adding padding-right to its div based
  // on the width of the scroll bar on screen
  function scrollBarCorrection() {
    let outerWidth = $('.mysqlSummaryContentDiv:eq(0)').outerWidth();
    let innerWidth = $('.mysqlSummaryContentDiv:eq(0) table').outerWidth();
    let padding = outerWidth - innerWidth;
    // Add padding to mysqlSummaryTableHeaderDiv
    // mysqlSummaryContentDiv has a padding-left of 1
    if (padding > 1) {
      $('.mysqlSummaryTableHeaderDiv').css('padding-right', padding + 'px');
    } else {
      // If no scroll bar add 10px to the padding right
      $('.mysqlSummaryDiv').css('padding-right', '10px');
    }
  }

  // Resize at the end of setup.
  resizeTable();
  updateChart();


  let exports = {};
  exports.resizeTable = resizeTable;
  exports.updateData = updateData;

  return exports;
}
