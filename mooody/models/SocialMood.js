// MongoDB Social Mood schema

var mongoose = require('mongoose');

var SocialMoodSchema = new mongoose.Schema({
  happy: {type: Number, default: 1},
  relaxed: {type: Number, default: 1},
  couldbebetter: {type: Number, default: 1},
  stressed: {type: Number, default: 1},
  sad: {type: Number, default: 1},
  angry: {type: Number, default: 1}
});
// Initialize everything to 1 so the chart is never empty (that'd be ugly!)

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
