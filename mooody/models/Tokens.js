// MongoDB Tokens schema

var mongoose = require('mongoose');
var randtoken = require('rand-token');

var VerificationTokenSchema = new mongoose.Schema({
  _userid: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User'},
  token: {type: String, required: true},
  time: {type: Date, required: true, default: Date.now, expires: '3h'}
});

VerificationTokenSchema.methods.createToken = function(done) {
	var VerificationToken = this;
	var token = randtoken.generate(6);
	VerificationToken.set('token', token);
	VerificationToken.save(function(err) {
		if (err) return done(err);
        return done(null, token);
        console.log("Verification token", VerificationToken);
	});
};

mongoose.model('Token', VerificationTokenSchema);
