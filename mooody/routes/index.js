var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('express-jwt');
var uuid = require('node-uuid-v4');
var ejs = require('ejs');
var random = require('mongoose-simple-random');
mongoose.plugin(random);

// Account verification *******************************************************

// Twilio SMS verification (obsolete; actual implementation uses email verification)
// var twilio = require('twilio');
// var client = twilio(process.env.TWI_KEY_1,
//   process.env.TWI_KEY_2);
// var twilionum = process.env.TWI_NUM;

// Postmark email verification (ditched; doesn't work with princeton.edu due to spam filter)
// var postmark = require("postmark")(process.env.POSTMARK_KEY);
// function sendVerificationEmail(options, done) {
//     var deliver = function (textBody) {
//         postmark.send({
//             "From": "xyyu@princeton.edu",
//             "To": 'xyyu@princeton.edu',
//             "Subject": "Verify your Mooody account",
//             "TextBody": 'Please work *cries*'
//         }, done);
//     };
//     ejs.renderFile("views/email-text.ejs", options, function (err, textBody) {
//         if (err) return done(err);
//         deliver(textBody)
//     });
// }

// SendGrid email verification
var helper = require('sendgrid').mail;
var fromEmail = new helper.Email('mooodyapp@gmail.com');
var subject = 'Verify your Mooody account';
var sg = require('sendgrid')(process.env.SENDGRID_API_KEY);

// Mongo Schemas **************************************************************

var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var SocialMood = mongoose.model('SocialMood');
var Token = mongoose.model('Token');
var Message = mongoose.model('Message');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

// Routing functions for posts/comments ***************************************

// GET home page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// GET the N most recent posts
router.get('/posts', function(req, res, next) {
    var query = Post.find({ deleted: false, flags: {$lt: 5} }, null, {limit: 200, sort: {'date': -1}});
    query.exec(function(err, posts) {
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

// Post parameter
router.param('post', function(req, res, next, id) {
  var query = Post.findById(id);

  query.exec(function (err, post){
    if (err) { return next(err); }
    if (!post) { return next(new Error('can\'t find post')); }

    req.post = post;
    return next();
  });
});

// Comment parameter
router.param('comment', function(req, res, next, id) {
  var query = Comment.findById(id);

  query.exec(function (err, comment){
    if (err) { return next(err); }
    if (!comment) { return next(new Error("can't find comment")); }

    req.comment = comment;
    return next();
  });
});

// GET comments of a post
router.get('/posts/:post', function(req, res) {
    req.post.populate('comments', function(err, post) {
        if (err) { return next(err); }
        if (!post.deleted) res.json(post);
        else res.json("ERROR");
    });
});

// PUT upvote for a post
router.put('/posts/:post/upvote', auth, function(req, res, next) {
  req.post.upvote(req.body.usr, function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

// PUT delete to true for a post (no actual deletion from database)
router.put('/posts/:post/delete', auth, function(req, res, next) {
  req.post.delete(req.body.usr, function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

// PUT flag for a post
router.put('/posts/:post/downvote', auth, function(req, res, next) {
  req.post.downvote(req.body.usr, function(err, post){
    if (err) { return next(err); }

    res.json(post);
  });
});

// POST a comment to a post
router.post('/posts/:post/comments', auth, function(req, res, next) {
  var comment = new Comment(req.body);
  comment.post = req.post;

  // Set tracking string for this comment within its post
  var newcommenter = true;
  // Search post's commenters array to see if this is a new commenter
  var results = req.post.commenters.filter(function(obj) {
    return obj.commenterid == req.body.authorid;
  });
  // If no results...
  if (!results.length) {
    // Could mean that commenter is OP
    if (comment.authorid == comment.post.authorid) {
      newcommenter = false;
      comment.commentTracker = "OP";
    }
    // Else, it's actually a new commenter
    else {
      newcommenter = true;
      comment.commentTracker = "Anon. " + req.post.commenterNumber;
    }
  }
  // If not a new commenter (who's not OP)...
  else {
    newcommenter = false;
    comment.commentTracker = "Anon. " + results[0].commenternum;
  }

  // Save new comment
  comment.save(function(err, comment){
    if(err) { return next(err); }

    // If successful, update the comment's post as well
    req.post.comments.push(comment);
    // Special things must be done if this is a new commenter
    if (newcommenter) {
      req.post.commenters.push({commenterid: comment.authorid, commenternum: req.post.commenterNumber});
      req.post.commenterNumber = req.post.commenterNumber + 1;
    }
    // Finally, save (update) the comment's post as well
    req.post.save(function(err, post) {
      if(err){ return next(err); }

      res.json(comment);
    });
  });
});

// PUT upvote for a comment
router.put('/posts/:post/comments/:comment/upvote', auth, function(req, res, next) {
  req.comment.upvote(req.body.usr, function(err, comment) {
    if (err) { return next(err); }

    res.json(comment);
  });
});

// PUT delete to true for a comment (no actual deletion from database)
router.put('/posts/:post/comments/:comment/delete', auth, function(req, res, next) {
  req.comment.delete(req.body.usr, function(err, comment) {
    if (err) { return next(err); }

    req.post.deleteComment(req.body.commentid, function(err, post) {
      if (err) { return next(err); }
      res.json({post:post,comment:comment});
    });
  });
  
});

// PUT flag for a comment
router.put('/posts/:post/comments/:comment/downvote', auth, function(req, res, next) {
  req.comment.downvote(req.body.usr, function(err, comment){
    if (err) { return next(err); }

    res.json(comment);
  });
});
  
// Routing functions for login/registration/verification **********************

// POST a user
router.post('/register', function(req, res, next) {
    if(!req.body.netid || !req.body.password){
        console.log("Error1 in index.js");
        return res.status(400).json({message: 'Please fill out all required fields'});
    }

    // Process email string
    var tempString = '';
    if (req.body.hasOwnProperty('optional') && "undefined" !== typeof req.body.optional) {
      if (typeof(req.body.optional) == 'string') tempString = req.body.optional;
    }
    tempString = req.body.netid + "@" + tempString + "princeton.edu";

    // Make sure that username is unique (username has since been removed)
    // User.findOne({username: req.body.username}, function(err, alreadyPresent) {
    //   if (err) return res.status(400).json({message: 'Registration failed. Please try again later.'});
    //   if (alreadyPresent != null) return res.status(400).json({message: 'Username taken. Please try again.'});
    // });

    // Make sure that email is unique
    User.findOne({email: tempString}, function(err, alreadyUsed) {
      if (err) return res.status(400).json({message: 'Registration failed. Please try again later.'});
      if (alreadyUsed != null) return res.status(400).json({message: 'This email is already registered.'});

    // If no error so far, then proceed with user registration
    // The rest of this code is wrapped inside findOne()'s callback
    var user = new User();
    //user.username = req.body.username;
    user.mood = 'Select one below!';
    user.status = '';
    user.email = tempString;
    user.verified = false;
    user.setPassword(req.body.password);
    
    // Save new user
    user.save(function(err, user) {
      if(err) { console.log(err); return next(err); }
      
      // Create new token for newly registered user
      var newtoken = new Token({_userid: user._id});
      newtoken.createToken(function(err, token) {
        if (err) return console.log("Couldn't create verification token", err);
        // Send verification email if successful so far
        //var toEmail = new helper.Email(user.email);
        console.log(process.env.SENDGRID_API_KEY);
        var toEmail = new helper.Email('xyyu@princeton.edu');
        var content = new helper.Content('text/plain', 'Hello from Mooody! Here is your verification code: ' + token);
        var mail = new helper.Mail(fromEmail, subject, toEmail, content);
        var request = sg.emptyRequest({
          method: 'POST',
          path: '/v3/mail/send',
          body: mail.toJSON()
        });
        sg.API(request, function (error, response) {
          if (error) {
            console.log('Error response received');
          }
          console.log(response.statusCode);
          console.log(response.body);
          console.log(response.headers);
        });

        // Twilio SMS verification (obsolete; actual implementation uses email verification)
        // client.sendMessage({
        //     to: user.phonenum,
        //     from: twilionum,
        //     body: 'Hello from Mooody! This is your code: ' + token
        // });
        // console.log("Twilio SMS sent");

        // Postmark email verification (ditched; doesn't work with princeton.edu due to spam filter)
        // var message = {
        //   email: user.email,
        //   name: user.username,
        //   verifyURL: token
        // };
        // sendVerificationEmail(message, function (error, success) {
        //   if (error) {
        //       console.error("Unable to send via postmark: " + error.message);
        //       return;
        //   }
        //   console.info("Sent to postmark for delivery");
        // });
      });

      return res.json({token: user.generateJWT()});
      });

      // End of findOne()'s callback
    });
});

// POST a login
router.post('/login', function(req, res, next){
    if(!req.body.email || !req.body.password){
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

// PUT a verification code
router.put('/verify', function(req, res, next){
  if (!req.body.tokenfield) {
      return res.status(400).json({failmessage: 'Please fill out the field'});
  }

  Token.findOne({token: req.body.tokenfield}, function(err, doc) {
    if (err || doc == null) return res.status(400).json({failmessage: 'Verification failed. Try again?'});
    User.findOne({_id: doc._userid}, function(err, user) {
      if (err) return res.status(400).json({failmessage: 'Verification failed. Try again?'});
      user.verified = true;
      user.save(function(err) {
        if (err) return res.status(400).json({failmessage: 'Verification failed. Try again?'});
        else return res.json({successmessage: 'Verification successful! Click the Log In button above to log in!'});
      });
    });
  });
});

// Routing functions for user param and user mood *****************************

// User parameter
router.param('user', function(req, res, next, id) {
  var query = User.findById(id);

  query.exec(function (err, userdocument){
    if (err) { return next(err); }
    if (!userdocument) { return next(new Error('can\'t find user')); }

    req.userdocument = userdocument;
    return next();
  });
});

// GET current mood of user
router.get('/usermood/:user', function(req, res, next) {
  res.json([{mood: req.userdocument.mood}]);
});

// PUT new mood for user
router.put('/usermood/:user/changemood', function(req, res, next) {
  req.userdocument.changeMoodTo(req.body.newmood, function(err, curruser){
    if (err) { return next(err); }
    res.json([{mood: curruser.mood}]);
  });
});

// Routing functions for social mood ******************************************

// GET social mood counts (a single document)
router.get('/socialmood', function(req, res, next) {
  SocialMood.find(function(err, socmood){
    if(err) { return next(err); }
    res.json(socmood);
  });
});

// PUT a count decrement for a social mood
router.put('/socialmood/decrement', function(req, res, next) {
  SocialMood.find(function(err, socmood){
    if(err) { return next(err); }
    socmood[0].decrement(req.body.mood, function(err, updatedsocmood) {
       if (err) { return next(err); }
       res.json([updatedsocmood]);
    });
  });
});

// PUT a count increment for a social mood
router.put('/socialmood/increment', function(req, res, next) {
  SocialMood.find(function(err, socmood){
    if(err) { return next(err); }
    socmood[0].increment(req.body.mood, function(err, updatedsocmood) {
       if (err) { return next(err); }
       res.json([updatedsocmood]);
    });
  });
});

// Routing functions for user status ******************************************

// GET current status of user
router.get('/userstatus/:user', function(req, res, next) {
  res.json({status: req.userdocument.status});
});

// PUT new status for user
router.put('/userstatus/:user/changestatus', function(req, res, next) {
  req.userdocument.changeStatusTo(req.body.newstatus, function(err, curruser){
    if (err) { return next(err); }
    res.json({status: curruser.status});
  });
});

// Routing functions for messaging ********************************************

// Use PUT to get a random user feeling low who's not the current user
// (Using PUT instead of GET to prevent URL querying; not sure if this is an actual worry? Works for now anyway.)
router.put('/randomuser', function(req, res, next) {
  var filters = { _id: { $ne:req.body.curruser }, mood: { $in: ['couldbebetter','sad', 'stressed', 'angry'] } };
  var fields = {};
  var options = {limit: 1};
  User.findRandom(filters, fields, options, function(err, results) {
    if (err) { return next(err); }
    if (!results) { res.json([{mood:'NA', status:'NA'}]); }
    else { res.json(results); }
  });
});

// Use PUT to get another random user feeling low who's not the current user nor the provided user
// (Using PUT instead of GET to prevent URL querying; not sure if this is an actual worry? Works for now anyway.)
router.put('/randomusernext', function(req, res, next) {
  var filters = { _id: { $nin: [req.body.curruser, req.body.provuser] }, mood: { $in: ['couldbebetter','sad', 'stressed', 'angry'] } };
  var fields = {};
  var options = {limit: 1};
  User.findRandom(filters, fields, options, function(err, results) {
    if (err) { return next(err); }
    if (!results) { res.json([{mood:'NA', status:'NA'}]); }
    else { res.json(results); }
  });
});

// POST a new message/note
router.post('/messages', function(req, res, next) {
  var message = new Message(req.body);

  message.save(function(err, post){
    if(err){ return next(err); }

    res.json(message);
  });
});

// GET all notes for a user
router.get('/allnotes/:user', function(req, res, next) {
  var filters = { recipient: req.userdocument._id };
  var fields = {}; 
  var options = {limit: 30, sort: {'date': -1}};

  var query = Message.find(filters, fields, options);

  query.exec(function(err, notes) {
    if(err) { return next(err); }
    if (!notes.length) { res.json([{author:'Dummy string', body:'Dummy string'}]); }
    else {res.json(notes)};
  });
});

module.exports = router;
