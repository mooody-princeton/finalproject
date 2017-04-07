// MongoDB Social Mood schema

var mongoose = require('mongoose');

var SocialMoodSchema = new mongoose.Schema({
  happy: {type: Number, default: 0},
  sad: {type: Number, default: 0},
  angry: {type: Number, default: 0}
});

mongoose.model('SocialMood', SocialMoodSchema);
