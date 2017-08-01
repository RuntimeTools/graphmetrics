// This script chooses a locale.properties and parses into an object containing each key-value string.
// These strings replace the hard-coded strings in each of the 10 charts + flamegraph.

// Detect locale
// IE
var userLocale;
if (navigator.browserLanguage) {
  userLocale = navigator.browserLanguage;
} else if (navigator.language) {
  // All other vendors
  userLocale = navigator.language;
}

function populateKeyArray(callback) {
  var file = new XMLHttpRequest();
  var pathToFile = '';
  // Provide .properties relative path - replace pathToFile with locale file
  if (userLocale === 'en') {
    pathToFile = 'graphmetrics/locales/allTitles.properties';
  } else {
    pathToFile = 'graphmetrics/locales/FILENAME_' + userLocale + '.properties';
  }

  file.onreadystatechange = function() {
    if (file.readyState === 4 && file.status === 200) {
      let lines = (file.responseText).split('\n');
      lines.pop();
      for (let i = 0; i < lines.length; i++) {
        let jsonStr = lines[i]
                        .replace('\r', '')
                        .replace('\"', '"')
                        .replace('\n', '')
                        .replace('=', ':');
        let keyVal = jsonStr.split(':');
        // Define the object field (key = [0] val = [1])
        object[keyVal[0]] = keyVal[1];
      }
      callback(object);
    }
  };
  file.open('GET', pathToFile, false);
  file.setRequestHeader('Content-Type', 'text/plain');
  file.send();
}
