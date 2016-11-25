'use strict';
const fs = require('fs');

const concordancesDir = './concordances',
      processedDir = './processed',
      taggedDir = './tagged';

/**
 * For each file in ./concordances, write a file in ./processed that contains no line numbers
 * or phrasal opening/closing tags
 */
function processConcordances() {
  fs.readdir(concordancesDir, function (err, files) {
    files.forEach(function (file) {
      fs.readFile(`${concordancesDir}/${file}`, 'utf8', function (err, data) {
        data = data.replace(/(#\d+\t)|(< | >)/g, ''); // remove #lineNumbers and phrasal opening/closing tags
        fs.writeFile(`${processedDir}/${file}`, data, function (err) {
          if (err) console.error(err.message);
          fs.writeFile(`${taggedDir}/${file}`, data, { flag: 'wx' }, function (err) {
            if (err) console.error(err.message);
          });
        });
      });
    })
  });
}

module.exports = processConcordances;
