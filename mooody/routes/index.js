var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');
var uuid = require('node-uuid-v4');
var ejs = require('ejs');

// Twilio SMS verification
var twilio = require('twilio');
var client = twilio("AC81ea8300e37e8108abc992eaaa2728fa",
  "4208d7046ce5b2a5b8a54e7b6b636690");
var twilionum = '+16092450655';

// Email verification (not working with princeton.edu, so we're using phone verification instead)
var key = "b8bae4ae-8d3e-449b-aaec-2d822d74eabc";
var postmark = require("postmark")(key);

// Mongo Schemas ******************************************

var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var SocialMood = mongoose.model('SocialMood');
var Token = mongoose.model('Token');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

// Functions **********************************************

// Email verification (not working with princeton.edu, so we're using phone verification instead)
// function sendVerificationEmail(options, done) {
//     var deliver = function (textBody) {
//         postmark.send({
//             "From": "xyyu@princeton.edu",
//             "To": 'lindyzeng.lz@gmail.com', //options.email,
//             "Subject": "Verify your Mooody account",
//             "TextBody": 'lol' //textBody
//         }, done);
//     };
//     ejs.renderFile("views/email-text.ejs", options, function (err, textBody) {
//         if (err) return done(err);
//         deliver(textBody)
//     });
// }

// Routing functions for posts/comments *******************

// GET home page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// GET posts
router.get('/posts', function(req, res, next) {
  Post.find(function(err, posts){
    if(err) { return next(err); }

    res.json(posts);
  });
});

// POST a post
router.post('/posts', function(req, res, next) {
  var post = new Post(req.body);

  post.save(function(err, post){
    if(err){ return next(err); }

    res.json(post);
  });
});

//
router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});

router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error("can't find comment")); }

    req.comment = comment;
    return next();
  });
});

router.get('/posts/:post', function(req, res) {
    req.post.populate('comments', function(err, post) {
        if (err) { return next(err); }
        res.json(post);
    });
});

router.put('/posts/:post/upvote', auth, function(req, res, next) {
  req.post.upvote(req.body.usr, function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

router.put('/posts/:post/downvote', auth, function(req, res, next) {
  req.post.downvote(req.body.usr, function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;

  comment.save(function(err, comment){
    if(err) { return next(err); }

    req.post.comments.push(comment);
    req.post.save(function(err, post) {
      if(err){ return next(err); }

      res.json(comment);
    });
  });
});

router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
  req.comment.upvote(req.body.usr, function(err, comment) {
    if (err) { return next(err); }

    res.json(comment);
  });
});

router.put('/posts/:post/comments/:comment/downvote', auth, function(req, res, next) {
  req.comment.downvote(req.body.usr, function(err, comment){
    if (err) { return next(err); }

    res.json(comment);
  });
});

// Routing functions for login/registration/verification ***************

router.post('/register', function(req, res, next){
    console.log("In index.js");
    if(!req.body.username || !req.body.password){
        console.log("Error1 in index.js");
        return res.status(400).json({message: 'Please fill out all fields'});
    }

    // Make sure that username and phone number are unique
    User.findOne({username: req.body.username}, function(err, alreadyPresent) {
      if (err) return res.status(400).json({message: 'Registration failed. Please try again later.'});
      if (alreadyPresent != null) return res.status(400).json({message: 'Username taken. Please try again.'});
      User.findOne({phonenum: "1" + req.body.phonenum}, function(err, alreadyUsed) {
        if (err) return res.status(400).json({message: 'Registration failed. Please try again later.'});
        if (alreadyUsed != null) return res.status(400).json({message: 'This phone number is already registered. Please try again.'});

    // If no error so far, then proceed with user registration
    // The rest of this code is wrapped inside the second User.findOne()'s callback
    var user = new User();
    user.username = req.body.username;
    user.mood = 'Select one below!';
    user.phonenum = "1" + req.body.phonenum;

    // Disabled email verification
    // var tempString = '';
    // if (req.body.hasOwnProperty('optional') && "undefined" !== typeof req.body.optional) {
    //   tempString = req.body.optional;
    // }
    // user.email = req.body.netid + "@" + tempString + "princeton.edu";

    user.verified = false;
    user.setPassword(req.body.password)
    // Save new user
    user.save(function(err, user) {
      if(err) { return next(err); }
      // Create new token for newly registered user
      var newtoken = new Token({_userid: user._id});
      newtoken.createToken(function(err, token) {
        if (err) return console.log("Couldn't create verification token", err);
        // Send confirmation SMS if successful so far
        client.sendMessage({
            to: '+16094552701', // Recipient number (either user's, or your own for testing)
            from: twilionum,
            body: 'Hello from Mooody! This is your code: ' + token
        });
        console.log("Twilio SMS sent");
      });

      // Send confirmation email (disabled)
      // var message = {
      //   email: user.email,
      //   name: user.username,
      //   verifyURL: 'lol'
      // };
      // sendVerificationEmail(message, function (error, success) {
      //   if (error) {
      //       console.error("Unable to send via postmark: " + error.message);
      //       return;
      //   }
      //   console.info("Sent to postmark for delivery");
      // });

      // Response
      return res.json({token: user.generateJWT()});
      });

      // End of callback
      });
    });
});

router.post('/login', function(req, res, next){
    if(!req.body.username || !req.body.password){
        return res.status(400).json({message: 'Please fill out all fields'});
    }

    console.log('\nCalling passport\n');
    passport.authenticate('local', function(err, user, info) {
        console.log('\nIn passport authenticate\n');
    if (err) { return next(err); }

    if (user) {
        return res.json({token: user.generateJWT()});
    } else {
        return res.status(401).json(info);
    }
    })(req, res, next);
});

router.put('/verify', function(req, res, next){
  Token.findOne({token: req.body.tokenfield}, function(err, doc) {
    if (err || doc == null) return res.status(400).json({failmessage: 'Verification failed. Try again?'});
    User.findOne({_id: doc._userid}, function(err, user) {
      if (err) return res.status(400).json({failmessage: 'Verification failed. Try again?'});
      user.verified = true;
      user.save(function(err) {
        if (err) return res.status(400).json({failmessage: 'Verification failed. Try again?'});
        else return res.json({successmessage: 'Verification successful! You can now proceed to log in.'});
      });
    });
  });
});

// Routing functions for user-related stuff ***************

// Set user parameter
router.param('user', function(req, res, next, id) {
  var query = User.findById(id);

  query.exec(function (err, userdocument){
    if (err) { return next(err); }
    if (!userdocument) { return next(new Error('can\'t find user')); }

    req.userdocument = userdocument;
    return next();
  });
});

// Get current mood of user
router.get('/usermood/:user', function(req, res, next) {
  res.json([{mood: req.userdocument.mood}]);
});

// Set new mood for user
router.put('/usermood/:user/changemood', function(req, res, next) {
  req.userdocument.changeMoodTo(req.body.newmood, function(err, curruser){
    if (err) { return next(err); }
    res.json([{mood: curruser.mood}]);
  });
});

// Routing functions for social mood **********************

// Return single social mood document
router.get('/socialmood', function(req, res, next) {
  SocialMood.find(function(err, socmood){
    if(err) { return next(err); }
    res.json(socmood);
  });
});

// Decrement social mood count
router.put('/socialmood/decrement', function(req, res, next) {
  SocialMood.find(function(err, socmood){
    if(err) { return next(err); }
    socmood[0].decrement(req.body.mood, function(err, updatedsocmood) {
       if (err) { return next(err); }
       res.json([updatedsocmood]);
    });
  });
});

// Increment social mood count
router.put('/socialmood/increment', function(req, res, next) {
  SocialMood.find(function(err, socmood){
    if(err) { return next(err); }
    socmood[0].increment(req.body.mood, function(err, updatedsocmood) {
       if (err) { return next(err); }
       res.json([updatedsocmood]);
    });
  });
});

module.exports = router;
