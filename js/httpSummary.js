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
function HttpSummary(divName, parentName, title) {
  // Bar chart for top 5 URLs by average request time
  let httpSummaryData = [];
  let httpSummaryOptions = {};
  var sort = {key: 'endpoint', reverse: false};

  // unicode for arrows
  let arrowUp = '&#9650;';
  let arrowDown = '&#9660;';

  // TODO - This should probably be a parameter to the constructor
  // or an argument to resizeTable().
  let tableHeight = 250;

  let httpSummary_barHeight = tallerGraphHeight / 5;
  // -8 for margin and border, min 100 in case this is on a hidden tab.
  let canvasWidth = Math.max($(divName).width() - 8, 100);
  let graphWidth = canvasWidth - margin.left - margin.right;
  let graphHeight = tableHeight - margin.top - margin.bottom;
  let httpSummary_xScale = d3.scale.linear().range([0, graphWidth]);

  let httpSummarySVG = d3.select(divName)
  .append('svg')
  .attr('class', 'httpSummaryChart');

  // Set titleBoxHeight here as we use it for the graph div below
  let titleBoxHeight = 30;
  let httpSummaryTitleBox = httpSummarySVG.append('rect')
  .attr('height', titleBoxHeight)
  .attr('class', 'titlebox');

  let httpSummaryChart = httpSummarySVG.append('g')
  .attr('transform',
  'translate(' + margin.left + ',' + margin.top + ')');

  // Add the title
  httpSummaryChart.append('text')
  .attr('x', 7 - margin.left)
  .attr('y', 15 - margin.top)
  .attr('dominant-baseline', 'central')
  .style('font-size', '18px')
  .text(title);

  // Add the placeholder text
  let httpSummaryChartPlaceholder = httpSummaryChart.append('text')
  .attr('text-anchor', 'middle')
  .style('font-size', '18px')
  .text(localizedStrings.NoDataMsg);

  function convertURL(url, graphWidth) {
    let stringToDisplay = url.toString();
    if (stringToDisplay.startsWith('http://' + httpSummaryOptions.host)) {
      stringToDisplay = stringToDisplay.substring(httpSummaryOptions.host.length + 7);
    }
    // Do a rough calculation to find out whether the URL will need more space than is available and truncate if it does
    let stringLength = stringToDisplay.length;
    let charSpaceAvailable = Math.floor(graphWidth / 8); // allow 8 pixels per character (higher than needed but allows space for the time at the end)
    if (stringLength > charSpaceAvailable) {
      stringToDisplay = '...' + stringToDisplay.substring(stringLength - charSpaceAvailable - 3);
    }
    return stringToDisplay;
  }

  let httpSummaryIsFullScreen = false;

  // Add the maximise button
  let summaryResize = httpSummarySVG.append('image')
  .attr('width', 24)
  .attr('height', 24)
  .attr('xlink:href', 'graphmetrics/images/maximize_24_grey.png')
  .attr('class', 'maximize')
  .on('click', function(){
    httpSummaryIsFullScreen = !httpSummaryIsFullScreen;
    d3.select(parentName).selectAll('.hideable').classed('invisible', httpSummaryIsFullScreen);
    d3.select(divName)
    .classed('fullscreen', httpSummaryIsFullScreen)
    .classed('invisible', false); // remove invisible from this chart
    if (httpSummaryIsFullScreen) {
      summaryResize.attr('xlink:href', 'graphmetrics/images/minimize_24_grey.png');
      // Redraw this chart only
      resizeTable();
    } else {
      canvasWidth = $(divName).width() - 8; // -8 for margins and borders
      graphWidth = canvasWidth - margin.left - margin.right;
      summaryResize.attr('xlink:href', 'graphmetrics/images/maximize_24_grey.png');
      tableHeight = 250;
      graphHeight = tableHeight - margin.top - margin.bottom;
      // Redraw all
      resize();
    }
  })
  .on('mouseover', function() {
    if (httpSummaryIsFullScreen) {
      summaryResize.attr('xlink:href', 'graphmetrics/images/minimize_24.png');
    } else {
      summaryResize.attr('xlink:href', 'graphmetrics/images/maximize_24.png');
    }
  })
  .on('mouseout', function() {
    if (httpSummaryIsFullScreen) {
      summaryResize.attr('xlink:href', 'graphmetrics/images/minimize_24_grey.png');
    } else {
      summaryResize.attr('xlink:href', 'graphmetrics/images/maximize_24_grey.png');
    }
  });

  // Attempt to add foreign object to http summary for list
  // summarydiv
  let httpSummaryContent = httpSummarySVG.append('foreignObject')
  .attr('width', graphWidth)
  .attr('height', (tableHeight-titleBoxHeight))
  .attr('x', '0')
  .attr('y', titleBoxHeight)
  .attr('class', 'httpSummaryContent');

  let httpSummaryDiv = httpSummaryContent
  .append('xhtml:body')
  .append('xhtml:div')
  .attr('class', 'httpSummaryDiv');

  let httpSummaryTableTitles = httpSummaryDiv.append('xhtml:div')
  .attr('class', 'httpSummaryTableHeaderDiv')
  .append('xhtml:table');

  // Set titles for table
  let httpSummaryTableTitlesRow = httpSummaryTableTitles.append('xhtml:tr');
  httpSummaryTableTitlesRow.append('xhtml:td').attr('class', 'httpSummaryTableHeader')
    .text('Endpoint').attr('id', 'endpoint').append('xhtml:span').html(arrowDown);
  httpSummaryTableTitlesRow.append('xhtml:td').attr('class', 'httpSummaryTableHeader')
    .text('Total Hits').attr('id', 'hits').append('xhtml:span');
  httpSummaryTableTitlesRow.append('xhtml:td').attr('class', 'httpSummaryTableHeader')
    .text('Average Times').attr('id', 'times').append('xhtml:span');

  let httpSummaryContentDivHeight = tableHeight-(40+titleBoxHeight+$('.httpSummaryTableHeaderDiv').height());
  let httpSummaryContentDiv = httpSummaryDiv.append('xhtml:div')
  .attr('class', 'httpSummaryContentDiv')
  .attr('cellspacing', '0')
  .attr('cellpadding', '0')
  .attr('style', 'height: ' + httpSummaryContentDivHeight + 'px')

  let httpSummaryContentTable = httpSummaryContentDiv.append('xhtml:table');

  function updateChart() {
    httpSummaryContentTable.html('');
    for (var i = 0; i < httpSummaryData.length; i++) {
      let dummyRow = httpSummaryContentTable.append('xhtml:tr');
      dummyRow.append('xhtml:td').text(httpSummaryData[i].url);
      dummyRow.append('xhtml:td').text(httpSummaryData[i].hits);
      dummyRow.append('xhtml:td').text(httpSummaryData[i].averageResponseTime);
    }
  }

  function updateHttpAverages(workingData) {
    httpSummaryData = sorting(workingData, sort.key);
    if (httpSummaryOptions['filteredPath']) {
      httpSummaryData = httpSummaryData.filter((d) => {
        return !((d.url == httpSummaryOptions.filteredPath) ||
        d.url.startsWith(httpSummaryOptions.filteredPath + '/'));
      });
    }

    function sorting(objectToSort, key) {
      function sortByKey(a, b) {
          var x = a[key];
          var y = b[key];
          return ((x < y) ? 1 : ((x > y) ? -1 : 0));
      }
      objectToSort.sort(sortByKey);
      if (sort.reverse) {
        objectToSort.reverse(sortByKey);
      }
      return objectToSort;
    }

    // Potentially the part which cuts the list to 5
    // if (httpSummaryData.length > 5) {
    //   httpSummaryData = httpSummaryData.slice(0, 5);
    // }
    updateChart();
  }

  // Sets the hostname to hide and
  // and path to filter from the top 5.
  // (The path to the dashboard.)
  function setHttpSummaryOptions(options) {
    httpSummaryOptions = options;
  }

  function updateURLData(data) {
    if (httpSummaryData.length == 0) {
      // first data - remove "No Data Available" label
      httpSummaryChartPlaceholder.attr('visibility', 'hidden');
    }
    let httpSummaryRequestData = JSON.parse(data);  // parses the data into a JSON array
    updateHttpAverages(httpSummaryRequestData);
  }

  function resizeTable() {
    if (httpSummaryIsFullScreen) {
      tableHeight = $(divName).height() - 100;
    }
    canvasWidth = Math.max($(divName).width() - 8, 100);
    graphWidth = canvasWidth - margin.left - margin.right;
    summaryResize
      .attr('x', canvasWidth - 30)
      .attr('y', 4);
    httpSummaryChartPlaceholder
      .attr('x', graphWidth / 2)
      .attr('y', graphHeight / 2);
    httpSummary_xScale = d3.scale.linear().range([0, graphWidth]);
    httpSummarySVG
      .attr('width', canvasWidth)
      .attr('height', tableHeight);
    httpSummaryTitleBox
      .attr('width', canvasWidth);
    httpSummaryContent
      .attr('width', canvasWidth)
      .attr('height', (tableHeight-titleBoxHeight));
    httpSummaryContentDivHeight = tableHeight-(40+titleBoxHeight+$('.httpSummaryTableHeaderDiv').height());
    httpSummaryContentDiv
      .attr('style', 'height: ' + httpSummaryContentDivHeight + 'px');
      scrollBarCorrection();
    updateChart();
  }

  // Correct the size of the table titles
  // by adding padding-right to its div based
  // on the width of the scroll bar on screen
  function scrollBarCorrection() {
    let outerWidth = $('.httpSummaryContentDiv:eq(0)').outerWidth();
    let innerWidth = $('.httpSummaryContentDiv:eq(0) table').outerWidth();
    let padding = outerWidth-innerWidth;
    // Add padding to httpSummaryTableHeaderDiv
    // httpSummaryContentDiv has a padding-left of 1
    if (padding > 1) {
      $('.httpSummaryTableHeaderDiv').css('padding-right', padding+'px');
    } else {
      // If no scroll bar add 10px to the padding right
      $('.httpSummaryDiv').css('padding-right', '10px');
    }
  }

  // Function to sort the data depending on how the user wants it to be ordered
  function sortData(e) {
    let switchCase = e.target.id.toString();
    // If the sort icon is clicked instead, get the id of its parent
    if (event.target.tagName === 'SPAN') {
      switchCase = ($(event.target).parent().attr('id')).toString();
    }
    switch(switchCase) {
      case sort.key:
        sort.reverse = !sort.reverse;
        break;
      case 'endpoint':
        sort.key = 'endpoint';
        sort.reverse = false;
        break;
      case 'hits':
        sort.key = 'hits';
        sort.reverse = false;
        break;
      case 'times':
        sort.key = 'times';
        sort.reverse = false;
        break;
      default:
        console.error('Not a sortable element');
    }
    updateSortArrows();
    updateHttpAverages(httpSummaryData);
  }

  // Function to update which arrow is shown on the screen to indicate sorting
  function updateSortArrows() {
    // The sort.key will always be the same as an id for
    // one of the three fields in the table
    $('.httpSummaryTableHeader span').html('');
    let arrow = arrowDown;
    if (sort.reverse) {
      arrow = arrowUp;
    }
    $('#' + sort.key + ' span').html(arrow);
  }

  // Resize at the end of setup.
  resizeTable();
  updateChart();

  // Onclick of table header, sort data
  $('.httpSummaryTableHeaderDiv td').click(sortData);

  let exports = {};
  exports.resizeTable = resizeTable;
  exports.updateURLData = updateURLData;
  exports.setHttpSummaryOptions = setHttpSummaryOptions;

  return exports;
}
