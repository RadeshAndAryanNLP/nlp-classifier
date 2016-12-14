'use strict';
const fs = require('fs'),
      readline = require('readline'),
      Line = require('../models/line.model'),
      mongoose = require('mongoose'),
      config = require('../config/config'),
      MONGODB_URI = config.MONGODB_URI;

mongoose.connect(MONGODB_URI, function () {
  console.log('Connected to database.');

  const trainingDataFileName = './training-data/training-data.txt',
        trainingData = readline.createInterface({
          input: fs.createReadStream(trainingDataFileName)
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
        languageType: languageType
      });
  
      newLine.save(err => {
        if (err) console.error(err);
      });
    });
  });
});
