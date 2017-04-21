// MongoDB Comments schema

var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
  body: String,
  //author: String,
  upvotes: {type: Number, default: 0},
  flags: {type: Number, default: 0},
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  userUpvotes: [ {type: String } ],
  userFlags: [ {type: String } ]
});

// Upvote comment
CommentSchema.methods.upvote = function(userid, cb) {
  if (this.userUpvotes.indexOf(userid) == -1) this.userUpvotes.push(userid);
  else this.userUpvotes.splice(this.userUpvotes.indexOf(userid),1);
  this.upvotes = this.userUpvotes.length;
  this.save(cb);
}

// Flag comment
CommentSchema.methods.downvote = function(userid, cb) {
  if (this.userFlags.indexOf(userid) == -1) this.userFlags.push(userid);
  else this.userFlags.splice(this.userFlags.indexOf(userid),1);
  this.flags = this.userFlags.length;
  this.save(cb);
}

// Check if user has upvoted
CommentSchema.methods.upvoted = function(userid, cb) {
  upvo = false;
  if (this.userUpvotes.indexOf(userid) == -1) upvo = true;
  this.save(cb);
  console.log(upvo);
  return upvo;
}

// Check if user has downvoted
CommentSchema.methods.downvoted = function(userid, cb) {
  downvo = false;
  if (this.userFlags.indexOf(userid) == -1) downvo = true;
  this.save(cb);
  console.log(downvo);
  return downvo;
}

mongoose.model('Comment', CommentSchema);
