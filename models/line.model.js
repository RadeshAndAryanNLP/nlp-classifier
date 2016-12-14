'use strict';
const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema({
  lineId: { type: Number, required: true, unique: true },
  sentence: { type: String, required: true, unique: true },
  phrase: { type: String, required: true },
  languageType: { type: String, required: true }
}, { timestamps: true });

const Line = mongoose.model('Line', lineSchema);
module.exports = Line;
