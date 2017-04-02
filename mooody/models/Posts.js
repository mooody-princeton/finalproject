// MongoDB Posts schema

var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title: String,
  //link: String,
  upvotes: {type: Number, default: 0},
  flags: {type: Number, default: 0},
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
  // post type: happy, sad, angry
  // list of upvotes, flags from users
  // Date/time
});

// Upvote post
PostSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
};

// Flag post
PostSchema.methods.flag = function(cb) {
    this.flags += 1;
    this.save(cb);
}

mongoose.model('Post', PostSchema);
