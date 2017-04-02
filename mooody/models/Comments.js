// MongoDB Comments schema

var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
  body: String,
  //author: String,
  upvotes: {type: Number, default: 0},
  flags: {type: Number, default: 0},
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
  // list of users who have upvoted, flagged
});

// Upvote comment
CommentSchema.methods.upvote = function(cb) {
    this.upvotes += 1;
    this.save(cb);
}

// Flag comment
CommentSchema.methods.flag = function(cb) {
    this.flags += 1;
    this.save(cb);
}

mongoose.model('Comment', CommentSchema);
