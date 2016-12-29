'use strict';
const fs = require('fs'),
      readline = require('readline'),
      Line = require('../models/line.model'),
      mongoose = require('mongoose'),
      config = require('../config/config'),
      MONGODB_URI = config.MONGODB_URI;

function saveDataToDB (filePath, dataType) {
  mongoose.connect(MONGODB_URI, () => {
    console.log(`Connected to database to save ${dataType}.`);
  
    const trainingData = readline.createInterface({
            input: fs.createReadStream(filePath)
          });
    
    trainingData.on('line', (line) => {
      const splitLine = line.split('\t'),
            lineId = splitLine[0],
            phrase = splitLine[1],
            languageType = splitLine[2],
            sentence = splitLine[3];
  
      Line.findOne({ 'lineId': lineId }, (err, line) => {
        if (err) console.error(err);
        if (line) return;
    
        // if line does not exist, create new line
        const newLine = new Line({
          lineId: lineId,
          sentence: sentence,
          phrase: phrase,
          languageType: languageType,
          dataType: dataType
        });
    
        newLine.save(err => {
          if (err) console.error(err.message);
        });
      });
    });
  });
}

saveDataToDB('./data/lex-train-data.txt', 'training-data');
saveDataToDB('./data/lex-dev-data.txt', 'dev-data');
