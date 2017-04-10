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
  else this.userUpvotes.pop(userid);
  this.upvotes = this.userUpvotes.length;
  this.save(cb);
}

// Flag comment
CommentSchema.methods.downvote = function(userid, cb) {
  if (this.userFlags.indexOf(userid) == -1) this.userFlags.push(userid);
  else this.userFlags.pop(userid);
  this.flags = this.userFlags.length;
  this.save(cb);
}

mongoose.model('Comment', CommentSchema);
