// MongoDB Posts schema

var mongoose = require('mongoose');

var PostSchema = new mongoose.Schema({
  title: String,
  imagelink: String,
  authorid: String,
  upvotes: {type: Number, default: 0},
  flags: {type: Number, default: 0},
  mood: String,
  date: Date,
  comments: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' } ],
  userUpvotes: [ { type: String } ],
  userFlags: [ { type: String } ],
  deleted: {type: Boolean, default: false}
});

// Upvote post
PostSchema.methods.upvote = function(userid, cb) {
  if (this.userUpvotes.indexOf(userid) == -1) this.userUpvotes.push(userid);
  else this.userUpvotes.splice(this.userUpvotes.indexOf(userid),1);
  this.upvotes = this.userUpvotes.length;
  this.save(cb);
};

// Upvote post
PostSchema.methods.delete = function(userid, cb) {
  // if (userid == authorid)
    this.deleted = true;
  this.save(cb);
};

// Flag post
PostSchema.methods.downvote = function(userid, cb) {
  if (this.userFlags.indexOf(userid) == -1) this.userFlags.push(userid);
  else this.userFlags.splice(this.userFlags.indexOf(userid),1);
  this.flags = this.userFlags.length;
  this.save(cb);
}

mongoose.model('Post', PostSchema);
