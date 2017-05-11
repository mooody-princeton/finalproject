// MongoDB Messages schema

var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
  author: String,
  recipient: String,
  body: String,
  date: Date
});

mongoose.model('Message', MessageSchema);
