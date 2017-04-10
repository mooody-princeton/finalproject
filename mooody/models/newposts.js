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
  userFlags: [ {type: mongoose.Schema.Types.ObjectId, ref: 'User'} ]
});

// Upvote post
PostSchema.methods.upvote = function(userid, cb) {
  // userid = "test007";
  if (this.userUpvotes.indexOf(userid) == -1) {
    this.userUpvotes.push(userid);
  }
  else {
    this.userUpvotes.pop(userid);
  }
  this.upvotes = this.userUpvotes.length;
  this.save(cb);
  // console.log(this.userUpvotes);
  // console.log(this.userUpvotes.length);
};

// Flag post
PostSchema.methods.downvote = function(cb) {
    this.flags += 1;
    this.save(cb);
}

mongoose.model('Post', PostSchema);
