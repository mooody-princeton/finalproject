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
  userUpvotes: [ {type: mongoose.Schema.Types.ObjectId, ref:'User'} ],
  userFlags: [ {type: mongoose.Schema.Types.ObjectId, ref: 'User'} ]
});

// Upvote post
PostSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
};

// Flag post
PostSchema.methods.downvote = function(cb) {
    this.flags += 1;
    this.save(cb);
}

mongoose.model('Post', PostSchema);
