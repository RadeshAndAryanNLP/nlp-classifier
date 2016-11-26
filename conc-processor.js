'use strict';
const fs = require('fs'),
      readlineSync = require('readline-sync');


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

      // begin user tagging process if tagged file does not exist
      fs.access(`${taggedDir}/${file}`, function (err) {
        if (err) {
          fs.readFile(`${concordancesDir}/${file}`, 'utf8', function (err, data) {
            data = data.replace(/(#\d+\t)|(< | >)/g, ''); // remove #lineNumbers and phrasal opening/closing tags
            fs.writeFile(`${processedDir}/${file}`, data, function (err) {
              if (err) console.error(err.message);
            });

            // ask user for 'f' or 'l' for every line of data
            let lines = data.split('\n');
            lines.forEach(function (line) {
              if (line.trim() === '') return; // if line is empty, continue to next line
              let response;
              line += '\t*** '; // add delimeter

              let figurativeOrLiteral = ['figurative', 'literal'];
              response = readlineSync.keyInSelect(figurativeOrLiteral, line + '\n', { guide: false });

              line += figurativeOrLiteral[response];
              line += '\n';
              fs.appendFile(`${taggedDir}/${file}`, line, function (err) {
                if (err) console.error(err.message);
              });
            });
          });
        }
      });
    })
  });
}

module.exports = processConcordances;
