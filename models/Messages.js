// MongoDB Messages schema

var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
  author: String,
  recipient: String,
  body: String,
  date: Date,
  deleted: {type: Boolean, default: false}
});

// Delete note
MessageSchema.methods.delete = function(userid, cb) {
  // if (userid == authorid)
  this.deleted = true;
  this.save(cb);
};

mongoose.model('Message', MessageSchema);
