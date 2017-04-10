var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var passport = require('passport');
var jwt = require('express-jwt');

// Mongo Schemas ******************************************

var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var SocialMood = mongoose.model('SocialMood');

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

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

// Routing functions for login/registration ***************

router.post('/register', function(req, res, next){
    console.log("In index.js");
    if(!req.body.username || !req.body.password){
        console.log("Error1 in index.js");
        return res.status(400).json({message: 'Please fill out all fields'});
    }

    var user = new User();
    user.username = req.body.username;
    user.mood = 'Select one below!';
    user.setPassword(req.body.password)
    user.save(function (err){
        if(err) { return next(err); }
    return res.json({token: user.generateJWT()})
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
