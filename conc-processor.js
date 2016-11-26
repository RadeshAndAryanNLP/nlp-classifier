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

          fs.readFile(`${concordancesDir}/${file}`, 'utf8', function (err, data) {
            data = data.replace(/(#\d+\t)|(< | >)/g, ''); // remove #lineNumbers and phrasal opening/closing tags
            fs.writeFile(`${processedDir}/${file}`, data, function (err) {
              if (err) console.error(err.message);
            });

            // ask user for 'f' or 'l' for every line of data
            let lines = data.split('\n');

            fs.open(`${taggedDir}/${file}`, 'a+', function (err, fd) {
              let fileData = fs.readFileSync(`${taggedDir}/${file}`, 'utf8');
              if (err) console.error(err.message);

              lines.forEach(function (line) {
                if (fileData.includes(line) || line.trim() === '') return; // if line already read or empty, continue to next line

                let figurativeOrLiteral = ['figurative', 'literal', 'DELETE', 'EXIT'];
                let response = readlineSync.keyInSelect(figurativeOrLiteral, line + '\n', { guide: false });
                if (response === 3) process.exit();

                if (response !== 2) { // 2 corresponds to delete; will not add to file
                  line += '\t*** '; // add delimeter
                  line += figurativeOrLiteral[response];
                  line += '\n';
                  fs.appendFile(fd, line, function (err) {
                    if (err) console.error(err);
                  })
                }
              });
            });
          });

    })
  });
}

module.exports = processConcordances;
