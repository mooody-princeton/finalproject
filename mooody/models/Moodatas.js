// MongoDB Moodatas (mood data entries) schema

var mongoose = require('mongoose');

var MoodataSchema = new mongoose.Schema({
  entryuser: String,
  date: Date,
  today: String,
  wellbeing: {type: Number},
  sleep: {type: Number},
  exercise: {type: Number},
  study: {type: Number},
  social: {type: Number}
});

mongoose.model('Moodata', MoodataSchema);
