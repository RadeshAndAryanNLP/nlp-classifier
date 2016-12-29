'use strict';
const natural = require('natural'),
      Tagger = require('./node_modules/natural/lib/natural').BrillPOSTagger,
      Line = require('./models/line.model'),
      baseFolder = './node_modules/natural/lib/natural/brill_pos_tagger',
      rulesFiles = baseFolder + '/data/English/tr_from_posjs.txt',
      lexiconFile = baseFolder + '/data/English/lexicon_from_posjs.json',
      defaultCategory = 'N';

/**
 * Generates a classifier adding all words besides phrase as features
 **/
exports.generateClassifierWithoutPhrase = function (callback) {
  const classifier = new natural.BayesClassifier();
  Line.find({ dataType: 'training-data' }, { __v: 0, _id: 0, lineId: 0, updatedAt: 0, createdAt: 0 }, (err, lines) => {
    if (err) console.error(err);
    lines.forEach(line => {
      let sentence = line.sentence;
      const language = line.languageType;
      sentence = sentence.replace(/<b>.*<\/b>/gi, ''); // delete phrase from sentence so not used as feature
      classifier.addDocument(sentence, language);
    });
    classifier.train();
    callback(classifier);
  });
};

/**
 * Generates a classifier by adding two words before and two words after phrase
 * as features
 **/
exports.generateClassifierWithSurroundingWords = function (callback) {
  const classifier = new natural.BayesClassifier();
  Line.find({ dataType: 'training-data' }, { __v: 0, _id: 0, lineId: 0, updatedAt: 0, createdAt: 0 }, (err, lines) => {
    if (err) console.error(err);

    lines.forEach(line => {
      const sentence = line.sentence,
            language = line.languageType;


      let features = extractWordsAroundPhrase(sentence);
      classifier.addDocument(features, language);
    });

    classifier.train();
    callback(classifier);
  });
};

/**
 * Generates a classifier by adding the POS tags of the surrounding two words of the phrase as features
 */
exports.generateClassifierWithSurroundingPOSTags = function (callback) {
  const classifier = new natural.BayesClassifier();
  const tagger = new Tagger(lexiconFile, rulesFiles, defaultCategory, error => {
    if (error) console.error(error.message);
    Line.find({ dataType: 'training-data' }, { __v: 0, _id: 0, lineId: 0, updatedAt: 0, createdAt: 0 }, (err, lines) => {
      if (err) console.error(err);
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
        classifier.addDocument(tags, language);
      });

      classifier.train();
      callback(classifier);
    });
  });
};

/**
 * Generates a classifier by adding the surrounding two words and their POS tags as features
 */
exports.generateClassifierWithSurroundingWordsAndPOSTags = function (callback) {
  const classifier = new natural.BayesClassifier();
  const tagger = new Tagger(lexiconFile, rulesFiles, defaultCategory, error => {
    if (error) console.error(error.message);

    Line.find({ dataType: 'training-data' }, { __v: 0, _id: 0, lineId: 0, updatedAt: 0, createdAt: 0 }, (err, lines) => {
      if (err) console.error(err);

      lines.forEach(line => {
        const sentence = line.sentence,
              language = line.languageType,
              surroundingWords = extractWordsAroundPhrase(sentence),
              surroundingTags = tagger.tag(surroundingWords.split(' '));
        let tags = '';
        surroundingTags.forEach(tag => {
          tags += tag[1] + ' ';
        });
        tags = tags.trim();
        const features = surroundingWords + ' ' + tags;
        classifier.addDocument(features, language);
      });

      classifier.train();
      callback(classifier);
    });
  });
};

/**
 * Generates a classifier by adding two words before and two words after phrase
 * along with POS tags as features
 */
const extractWordsAroundPhrase = function (sentence) {
  // the sentence will be divided into three sections:
  // leftSide: contains all words to the left of the phrase
  // the phrase (not saved in a variable) contains the phrase
  // rightSide: contains all words to the right of the phrase
  const phraseMatch = sentence.match(/^(.*)<b>.*<\/b>(.*)$/), // due to the way regex works, matches last word of phrase
      leftSide = phraseMatch[1].replace(/<b>.*<\/b>/gi, '').trim(), // delete bold words from left side
      rightSide = phraseMatch[2].trim();

  // the two words before the phrase are the last two words of the left side; similarly for the two words after the phrase
  let wordsBeforePhrase = '', wordsAfterPhrase = '';

  if (leftSide) {
    const leftSideWords = leftSide.split(' '),
        leftSideWordsLength = leftSideWords.length,
        secondWordBeforePhrase = leftSideWords[leftSideWordsLength-2] || '',
        wordBeforePhrase = leftSideWords[leftSideWordsLength-1] || '';
    wordsBeforePhrase += secondWordBeforePhrase + ' ' + wordBeforePhrase;
    wordsBeforePhrase.trim().replace(/\s+/, ' ');
  }

  if (rightSide) {
    const rightSideWords = rightSide.split(' '),
        wordAfterPhrase = rightSideWords[0] || '',
        secondWordAfterPhrase = rightSideWords[1] || '';
    wordsAfterPhrase += wordAfterPhrase + ' ' + secondWordAfterPhrase;
    wordsAfterPhrase.trim().replace(/\s+/, ' ');
  }

  let wordsAroundPhrase = wordsBeforePhrase + ' ' + wordsAfterPhrase;
  return wordsAroundPhrase.trim();
};

exports.extractWordsAroundsPhrase = extractWordsAroundPhrase;
