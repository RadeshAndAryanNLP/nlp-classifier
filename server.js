'use strict';
const mongoose = require('mongoose'),
    MONGODB_URI = require('./config/config').MONGODB_URI,
    classifier = require('./classifier'),
    generateClassifierWithoutPhrase = classifier.generateClassifierWithoutPhrase,
    generateClassifierWithSurroundingWords = classifier.generateClassifierWithSurroundingWords,
    generateClassifierWithSurroundingPOSTags = classifier.generateClassifierWithSurroundingPOSTags,
    extractWordsAroundPhrase = classifier.extractWordsAroundsPhrase,
    Tagger = require('./node_modules/natural/lib/natural').BrillPOSTagger,
    baseFolder = './node_modules/natural/lib/natural/brill_pos_tagger',
    rulesFiles = baseFolder + '/data/English/tr_from_posjs.txt',
    lexiconFile = baseFolder + '/data/English/lexicon_from_posjs.json',
    defaultCategory = 'N',
    Line = require('./models/line.model');

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('connected to DB');

  generateClassifierWithoutPhrase(classifier => {
    Line.find({ dataType: 'dev-data'}, { _id: 0, lineId: 0, updatedAt: 0, createdAt: 0, __v: 0 }, (err, lines) => {
      const numLines = lines.length;
      if (err) console.error(err.message);

      let numHits = 0;
      lines.forEach(line => {
        const sentence = line.sentence,
              language = line.languageType,
              features = sentence.replace(/<b>.+<\/b>/gi, ''), // delete the phrase
              classification = classifier.classify(features);

        if (language === classification) {
          ++numHits;
        }
      });

      const accuracy = numHits / numLines;
      console.log(`The all words classifier has ${accuracy*100}% accuracy`);
    });
  });

  generateClassifierWithSurroundingWords(classifier => {
    Line.find({ dataType: 'dev-data'}, { _id: 0, lineId: 0, updatedAt: 0, createdAt: 0, __v: 0 }, (err, lines) => {
      if (err) console.error(err.message);
      const numLines = lines.length;

      let numHits = 0;
      lines.forEach(line => {
        const sentence = line.sentence,
              language = line.languageType,
              features = extractWordsAroundPhrase(sentence);

        if (language === classifier.classify(features)) {
          ++numHits;
        }
      });
      const accuracy = numHits / numLines;
      console.log(`The surrounding words classifier has ${accuracy*100}% accuracy.`);
    });
  });

  generateClassifierWithSurroundingPOSTags((classifier) => {
    const tagger = new Tagger(lexiconFile, rulesFiles, defaultCategory, error => {
      if (error) console.error(error.message);
      Line.find({ dataType: 'dev-data'}, { _id: 0, lineId: 0, updatedAt: 0, createdAt: 0, __v: 0 }, (err, lines) => {
        if (err) console.error(err.message);
        const numLines = lines.length;

        let numHits = 0;
        lines.forEach(line => {
          const sentence = line.sentence,
                language = line.languageType,
                features = extractWordsAroundPhrase(sentence),
                featuresArray = tagger.tag(features.split(' '));
          let tags = ''; // classifier takes in a string; tags to be separated by non-breaking whitespace
          featuresArray.forEach(feature => {
            const tag = feature[1];
            tags += tag + ' ';
          });
          tags = tags.trim();

          if (language === classifier.classify(tags)) {
            ++numHits;
          }
        });
        const accuracy = numHits / numLines;
        console.log(`The surrounding POS classifier has ${accuracy*100}% accuracy`);
      });
    });
  });
});
