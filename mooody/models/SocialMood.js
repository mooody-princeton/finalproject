// MongoDB Social Mood schema

var mongoose = require('mongoose');

var SocialMoodSchema = new mongoose.Schema({
  happy: {type: Number, default: 0},
  sad: {type: Number, default: 0},
  angry: {type: Number, default: 0},
  // userHappy: [ {type: String } ],
  userSad: [ {type: String } ],
  userAngry: [ {type: String } ]
});

// Decrement social mood count
SocialMoodSchema.methods.decrement = function(mood, cb) {
	this[mood] -= 1;
	this.save(cb);
};

// Increment social mood count
SocialMoodSchema.methods.increment = function(mood, cb) {
	this[mood] += 1;
	this.save(cb);
};

mongoose.model('SocialMood', SocialMoodSchema, 'socialmood');
