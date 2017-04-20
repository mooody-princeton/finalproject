// MongoDB Posts schema

var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title: String,
  body: String,
  upvotes: {type: Number, default: 0},
  flags: {type: Number, default: 0},
  mood: String,
  date: Date,
  comments: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' } ],
  userUpvotes: [ {type: String } ],
  userFlags: [ {type: String } ]
});

// Upvote post
PostSchema.methods.upvote = function(userid, cb) {
  if (this.userUpvotes.indexOf(userid) == -1) this.userUpvotes.push(userid);
  else this.userUpvotes.splice(this.userUpvotes.indexOf(userid),1);
  this.upvotes = this.userUpvotes.length;
  this.save(cb);
};

// Flag post
PostSchema.methods.downvote = function(userid, cb) {
  if (this.userFlags.indexOf(userid) == -1) this.userFlags.push(userid);
  else this.userFlags.splice(this.userFlags.indexOf(userid),1);
  this.flags = this.userFlags.length;
  this.save(cb);
}

// Check if user has upvoted
PostSchema.methods.upvoted = function(userid, cb) {
  upvo = false;
  if (this.userUpvotes.indexOf(userid) == -1) upvo = true;
  this.save(cb);
  return upvo;
}

// Check if user has downvoted
PostSchema.methods.downvoted = function(userid, cb) {
  downvo = false;
  if (this.userFlags.indexOf(userid) == -1) downvo = true;
  this.save(cb);
  return downvo;
}

mongoose.model('Post', PostSchema);
