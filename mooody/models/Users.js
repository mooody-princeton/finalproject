var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');


var UserSchema = new mongoose.Schema({
  username: {type: String, lowercase: true, unique: true, required: true},
  hash: String,
  salt: String,
  mood: String,
  status: String,
  phonenum: {type: Number, unique:true, required: true},
  // email: {type: String, lowercase: true, unique: true},
  verified: Boolean
});

UserSchema.methods.generateJWT = function() {

  // set expiration to 60 days
  var today = new Date();
  var exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({
    _id: this._id,
    username: this.username,
    exp: parseInt(exp.getTime() / 1000),
  }, 'SECRET');
};

UserSchema.methods.setPassword = function(password){
  this.salt = crypto.randomBytes(16).toString('hex');

  this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
};

UserSchema.methods.validPassword = function(password) {
  var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');

  return this.hash === hash;
};

// Change user's mood
UserSchema.methods.changeMoodTo = function(mood, cb){
  this.mood = mood;
  this.save(cb);
};

// Change user's status
UserSchema.methods.changeStatusTo = function(status, cb){
  this.status = String(status);
  this.save(cb);
};

mongoose.model('User', UserSchema);
