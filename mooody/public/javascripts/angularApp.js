angular.module('mooody', ['ui.router'])

var app = angular.module('mooody', ['ui.router']);

// UI Routing *********************************************

// URL Routing for UI (switching between home, login, register, and comments pages)
app.config(['$stateProvider','$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

    $stateProvider.state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      resolve: {
          postPromise: ['posts', function(posts) {
                return posts.getAll();
          }],
          moodPromise: ['auth', function(auth) {
                if (auth.isLoggedIn()) {
                    return auth.getUserMood(auth.currentUserId());
                }
          }],
          socialmoodPromise: ['auth', function(auth) {
                return auth.getSocialMood();
          }]
      }
    });
    $stateProvider.state('posts', {
      url: '/posts/{id}',
      templateUrl: '/posts.html',
      controller: 'PostsCtrl',
      resolve: {
          post: ['$stateParams', 'posts', function($stateParams, posts) {
              return posts.get($stateParams.id);
          }],
          moodPromise: ['auth', function(auth) {
                if (auth.isLoggedIn()) {
                    return auth.getUserMood(auth.currentUserId());
                }
          }],
          socialmoodPromise: ['auth', function(auth) {
                return auth.getSocialMood();
          }]
      }
    });
    $stateProvider.state('login', {
        url: '/login',
        templateUrl: '/login.html',
        controller : 'AuthCtrl',
        onEnter : ['$state', 'auth',
    		function($state, auth) {
    			if (auth.isLoggedIn()) {
    				$state.go('home');
    			}
            }]
    });
    $stateProvider.state('register', {
        url : '/register',
        templateUrl : '/register.html',
        controller : 'AuthCtrl',
        onEnter : ['$state', 'auth',
            function($state, auth) {
                if (auth.isLoggedIn()) {
                    $state.go('home');
                }
            }]
    });
    $stateProvider.state('verify', {
        url : '/verify',
        templateUrl : '/verify.html',
        controller : 'AuthCtrl',
        onEnter : ['$state', 'auth',
            function($state, auth) {
                if (auth.isLoggedIn()) {
                    $state.go('home');
                }
            }]
    });
  $urlRouterProvider.otherwise('home');
}]);

// Factories **********************************************

// Authorization factory, simultaneously takes care of mood tracking
app.factory('auth', ['$http', '$window',
function($http, $window) {
	var auth = {
        usermood: [],
        socialmood: [],
        status: String,
        statusSaved: Boolean
    };
	auth.saveToken = function(token) {
		$window.localStorage['mooody-token'] = token;
	};
	auth.getToken = function() {
		return $window.localStorage['mooody-token'];
	}
	auth.isLoggedIn = function() {
		var token = auth.getToken();

		if (token) {
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};
	auth.currentUser = function() {
		if (auth.isLoggedIn()) {
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};
    // Return current user's id
    auth.currentUserId = function() {
        if (auth.isLoggedIn()) {
            var token = auth.getToken();
            var payload = JSON.parse($window.atob(token.split('.')[1]));

            return payload._id;
        }
    };
	auth.register = function(user) {
		return $http.post('/register', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};
	auth.logIn = function(user) {
		return $http.post('/login', user).success(function(data) {
			auth.saveToken(data.token);
		});
	};
	auth.logOut = function() {
		$window.localStorage.removeItem('mooody-token');
	};
    // Verify user account for activation
    auth.verify = function(tokenparam) {
        return $http.put('/verify', {tokenfield: tokenparam});
    };
    // Return current user's mood by setting factory variable property
    auth.getUserMood = function(userid) {
        return $http.get('/usermood/' + userid, null, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data) {
            angular.copy(data, auth.usermood);
        });
    };
    // Set current user's mood
    auth.setUserMood = function(userid, moodString) {
        return $http.put('/usermood/' + userid + '/changemood', {newmood: moodString}, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data) {
            angular.copy(data, auth.usermood);
        });
    };
    // Get current social mood stats
    auth.getSocialMood = function() {
        return $http.get('/socialmood').success(function(data) {
               angular.copy(data, auth.socialmood);
            });
    };
    // Decrement a social mood count
    auth.decrementSocialMood = function(oldMood) {
        return $http.put('/socialmood/decrement', {mood: oldMood}, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data) {
            angular.copy(data, auth.socialmood);
        });
    };
    // Increment a social mood count
    auth.incrementSocialMood = function(newMood) {
        return $http.put('/socialmood/increment', {mood: newMood}, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data) {
            angular.copy(data, auth.socialmood);
        });
    };
    // Get user status
    auth.getUserStatus = function(userid) {
        return $http.get('/userstatus/' + userid, null, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data) {
            angular.copy(data.status, auth.status);
            auth.statusSaved = true;
        });    
    };
    // Set user status
    auth.setUserStatus = function(userid, statusString) {
        return $http.put('/userstatus/' + userid + '/changestatus', {newstatus: statusString}, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data) {
            auth.status = data.status;
            auth.statusSaved = true;
        });        
    };
	return auth;
}]);

// Posts factory
app.factory('posts', ['$http', 'auth', function($http, auth) {
    var o = {
        posts: []
    };
    o.getAll = function() {
        return $http.get('/posts').success(function(data) {
            angular.copy(data, o.posts);
            // Take care of heart/flag buttons display
            var i;
            for (i = 0; i < o.posts.length; i++) {
                if (!auth.isLoggedIn()) {
                    o.posts[i].upvoted = false;
                    o.posts[i].flagged = false;
                }
                else {
                    if (o.posts[i].userUpvotes.indexOf(auth.currentUserId()) == -1) o.posts[i].upvoted = false;
                    else o.posts[i].upvoted = true;
                    if (o.posts[i].userFlags.indexOf(auth.currentUserId()) == -1) o.posts[i].flagged = false;
                    else o.posts[i].flagged = true;
                }
            }
        });
    };
    o.create = function(post) {
        return $http.post('/posts', post, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data) {
            o.posts.push(data);
        });
    };
    o.upvote = function(userid, post) {
        return $http.put('/posts/' + post._id + '/upvote', {usr: userid}, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data) {
            post.upvotes = data.userUpvotes.length;
            post.userUpvotes = data.userUpvotes;
            });
    };
    o.delete = function(userid, post) {
        return $http.put('/posts/' + post._id + '/delete', {usr: userid}, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data) {
            post.deleted = data.deleted;
            });
    };
    o.downvote = function(userid, post) {
        return $http.put('/posts/' + post._id + '/downvote', {usr: userid}, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
	    }).success(function(data){
            post.flags = data.userFlags.length;
            post.userFlags = data.userFlags;
	        });
	};
    o.get = function(id) {
        return $http.get('/posts/' + id).then(function(res){
                // Take care of heart/flag buttons display for the post's comments
                var i;
                for (i = 0; i < res.data.comments.length; i++) {
                    if (!auth.isLoggedIn()) {
                        res.data.comments[i].upvoted = false;
                        res.data.comments[i].flagged = false;
                    }
                    else {
                        if (res.data.comments[i].userUpvotes.indexOf(auth.currentUserId()) == -1) res.data.comments[i].upvoted = false;
                        else res.data.comments[i].upvoted = true;
                        if (res.data.comments[i].userFlags.indexOf(auth.currentUserId()) == -1) res.data.comments[i].flagged = false;
                        else res.data.comments[i].flagged = true;
                    }
                }
                // Take care of heart/flag buttons display for the post itself
                if (!auth.isLoggedIn()) {
                    res.data.upvoted = false;
                    res.data.flagged = false;
                }
                else {
                    if (res.data.userUpvotes.indexOf(auth.currentUserId()) == -1) res.data.upvoted = false;
                    else res.data.upvoted = true;
                    if (res.data.userFlags.indexOf(auth.currentUserId()) == -1) res.data.flagged = false;
                    else res.data.flagged = true;
                }
                return res.data;
            });
    };
    o.addComment = function(id, comment) {
        return $http.post('/posts/' + id + '/comments', comment, {
             headers: { Authorization: 'Bearer ' + auth.getToken() }
        });
    };
    o.upvoteComment = function(userid, post, comment) {
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', {usr: userid}, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function(data){
            comment.upvotes = data.userUpvotes.length;
            comment.userUpvotes = data.userUpvotes;
        });
    };
    o.deleteComment = function(userid, post, comment) {
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/delete', {usr: userid}, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function(data){
            console.log(data);
            comment.deleted = data.deleted;
        });
    };
    o.downvoteComment = function(userid, post, comment) {
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/downvote', {usr: userid}, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function(data){
            // console.log(data);
            comment.flags = data.userFlags.length;
            comment.userFlags = data.userFlags;
        });
    };
    return o;
}]);

// Services ***********************************************

// Load social mood info upon accessing website, for sidebar
app.service('socialinfo', function($http) {
    var promise = $http.get('/socialmood').success(function(data) {
        var socialinfo = data;
        return socialinfo;
    });
    return promise;
});

// Load user mood info upon accessing website, for sidebar
app.service('usermoodinfo', ['$http', 'auth', function($http, auth) {
    var promise = $http.get('/usermood/' + auth.currentUserId(), null, {
        headers: { Authorization: 'Bearer ' + auth.getToken()}
    }).success(function(data) {
        var usermoodinfo = data;
        return usermoodinfo;
    });
    return promise;
}]);

// Load user status info upon accessing website, for sidebar
app.service('userstatusinfo', ['$http', 'auth', function($http, auth) {
    var promise = $http.get('/userstatus/' + auth.currentUserId(), null, {
        headers: { Authorization: 'Bearer ' + auth.getToken()}
    }).success(function(data) {
        auth.statusSaved = true;
        var userstatusinfo = data;
        return userstatusinfo;
    });
    return promise;
}]);

// Controllers ********************************************

// Main Controller (home page)
app.controller('MainCtrl', ['$scope', 'posts', 'auth',
    function($scope, posts, auth) {
        $scope.posts = posts.posts;
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.title = '';
        $scope.imagelink = '';
        $scope.whitespace = '       ';
        $scope.currentUser = auth.currentUser;
        $scope.currentUserId = auth.currentUserId;

        // Filter by mood and order by date/popularity
        $scope.filters = {};
        $scope.filters.mood = 'happy'
        $scope.orders = '-date';
        $scope.placeholder = 'Why are you happy?'
        $scope.inFilter = true;

        // Highlight tabs
        $scope.active_h = 'w3-border-yellow';
        $scope.active_s = 'w3-border-inactive';
        $scope.active_a = 'w3-border-inactive';
        $scope.active_all = 'w3-border-inactive';
        $scope.active_hot = 'w3-border-inactive';
        $scope.active_new = 'w3-border-blue';

        // Add post
        $scope.addPost = function() {
            if (!$scope.title || $scope.title === '') { return; }
            posts.create({
                title: $scope.title,
                authorid: auth.currentUserId(),
                imagelink: $scope.imagelink,
                mood: $scope.filters.mood,
                date: new Date()
            });
            $scope.title = '';
            $scope.imagelink = '';
            document.getElementById('write').style.display='none';
        };

        // Set heart button toggle appropriately
        $scope.checkUpvoted = function(post) {
            if (!auth.isLoggedIn()) $scope.posts.find(x=>x._id == post._id).upvoted = false; // Should never happen
            else if (post.userUpvotes.indexOf(auth.currentUserId()) == -1) $scope.posts.find(x=>x._id == post._id).upvoted = false;
            else $scope.posts.find(x=>x._id == post._id).upvoted = true;
            $scope.$applyAsync(); // Apply changes in view
        };

        // Upvote post
        $scope.incrementUpvotes = function(post) {
            posts.upvote(auth.currentUserId(), post).then(function() {$scope.checkUpvoted(post);});
        };

        // Delete post
        $scope.deletePost = function(post) {
            posts.delete(auth.currentUserId(), post);
        };

        // Set flag button toggle appropriately
        $scope.checkFlagged = function(post) {
            if (!auth.isLoggedIn()) $scope.posts.find(x=>x._id == post._id).flagged = false; // Should never happen
            else if (post.userFlags.indexOf(auth.currentUserId()) == -1) $scope.posts.find(x=>x._id == post._id).flagged = false;
            else $scope.posts.find(x=>x._id == post._id).flagged = true;
            $scope.$applyAsync(); // Apply changes in view
        };

        // Flag post
        $scope.incrementFlags = function(post) {
            posts.downvote(auth.currentUserId(), post).then(function() {$scope.checkFlagged(post);});
        };

        // Filter posts by mood
        $scope.tab = function(tab) {
            if (tab === 'happy') {
                $scope.filters.mood = 'happy';
                $scope.placeholder = 'Why are you happy?'
                $scope.inFilter = true;
                $scope.active_h = 'w3-border-yellow';
                $scope.active_s = 'w3-border-inactive';
                $scope.active_a = 'w3-border-inactive';
                $scope.active_all = 'w3-border-inactive';
            }
            else if (tab === 'sad') {
                $scope.filters.mood = 'sad';
                $scope.placeholder = 'Why are you sad?'
                $scope.inFilter = true;
                $scope.active_h = 'w3-border-inactive';
                $scope.active_s = 'w3-border-blue';
                $scope.active_a = 'w3-border-inactive';
                $scope.active_all = 'w3-border-inactive';
            }
            else if (tab === 'angry') {
                $scope.filters.mood = 'angry';
                $scope.placeholder = 'Why are you angry?'
                $scope.inFilter = true;
                $scope.active_h = 'w3-border-inactive';
                $scope.active_s = 'w3-border-inactive';
                $scope.active_a = 'w3-border-red';
                $scope.active_all = 'w3-border-inactive';
            }
            else {
                $scope.filters = {};
                $scope.placeholder = 'Filter by mood in order to post'
                $scope.inFilter = false;
                $scope.active_h = 'w3-border-inactive';
                $scope.active_s = 'w3-border-inactive';
                $scope.active_a = 'w3-border-inactive';
                $scope.active_all = 'w3-border-black';
            }
            $scope.posts = posts.posts;
        };

        // Toggle posts by date or upvotes
        $scope.toggle = function(order) {
            if (order == 'hot') {
                $scope.orders = '-upvotes';
                $scope.active_hot = 'w3-border-red';
                $scope.active_new = 'w3-border-inactive';
            }
            else {
                $scope.orders = '-date';
                $scope.active_hot = 'w3-border-inactive';
                $scope.active_new = 'w3-border-blue';
            }
        };

        // Determine whether to disable "Post" button based on filter
        $scope.isInFilter = function() {
            return $scope.inFilter;
        };

        // Expand image on click
        $scope.expandImg = function(title, imagelink) {
            document.getElementById('imgExpand').style.display = 'block';
            $scope.imagelink = imagelink;
            $scope.title = title;
        };

        // Unexpand image
        $scope.unexpandImg = function() {
            document.getElementById('imgExpand').style.display='none';
            $scope.imagelink = '';
            $scope.title = '';
        };

        // Expand delete modal on click
        $scope.deleteCheck = function(post) {
            document.getElementById('delcheck').style.display = 'block';
            $scope.curPost = post;
        };
    }]);

// Posts Controller
app.controller('PostsCtrl', ['$scope', 'posts', 'post', 'auth',
    function($scope, posts, post, auth) {
        $scope.post = post;
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.currentUserId = auth.currentUserId;

        $scope.addComment = function() {
            if ($scope.body === '') { return; }
            posts.addComment(post._id, {
                body: $scope.body,
                authorid: auth.currentUserId(),
            }).success(function(comment) {
                $scope.post.comments.push(comment);
            });
          $scope.body = '';
        };

        // Set heart button toggle appropriately for a comment
        $scope.checkUpvoted = function(comment) {
            if (!auth.isLoggedIn()) $scope.post.comments.find(x=>x._id == comment._id).upvoted = false; // Should never happen
            else if (comment.userUpvotes.indexOf(auth.currentUserId()) == -1) $scope.post.comments.find(x=>x._id == comment._id).upvoted = false;
            else $scope.post.comments.find(x=>x._id == comment._id).upvoted = true;
            $scope.$applyAsync(); // Apply changes in view
        };

        // For a comment
        $scope.incrementUpvotes = function(comment) {
            posts.upvoteComment(auth.currentUserId(), post, comment).then(function() {$scope.checkUpvoted(comment);});
        };

        // Delete a comment
        $scope.deleteComment = function(comment) {
            posts.deleteComment(auth.currentUserId(), post, comment);
        };

        // Set flag button toggle appropriately for a comment
        $scope.checkFlagged = function(comment) {
            if (!auth.isLoggedIn()) $scope.post.comments.find(x=>x._id == comment._id).flagged = false; // Should never happen
            else if (comment.userFlags.indexOf(auth.currentUserId()) == -1) $scope.post.comments.find(x=>x._id == comment._id).flagged = false;
            else $scope.post.comments.find(x=>x._id == comment._id).flagged = true;
            $scope.$applyAsync(); // Apply changes in view
        };

        // For a comment
        $scope.incrementFlags = function(comment) {
            posts.downvoteComment(auth.currentUserId(), post, comment).then(function() {$scope.checkFlagged(comment);});
        };

        // Set heart button toggle appropriately for this post
        $scope.checkUpvotedPost = function() {
            if (!auth.isLoggedIn()) $scope.post.upvoted = false; // Should never happen
            else if ($scope.post.userUpvotes.indexOf(auth.currentUserId()) == -1) $scope.post.upvoted = false;
            else $scope.post.upvoted = true;
            $scope.$applyAsync(); // Apply changes in view
        };

        // For this post
        $scope.incrementUpvotesPost = function() {
            posts.upvote(auth.currentUserId(), $scope.post).then(function() {$scope.checkUpvotedPost();});
        };

        // Set flag button toggle appropriately for this post
        $scope.checkFlaggedPost = function() {
            if (!auth.isLoggedIn()) $scope.post.flagged = false; // Should never happen
            else if ($scope.post.userFlags.indexOf(auth.currentUserId()) == -1) $scope.post.flagged = false;
            else $scope.post.flagged = true;
            $scope.$applyAsync(); // Apply changes in view
        };

        // For this post
        $scope.incrementFlagsPost = function() {
            posts.downvote(auth.currentUserId(), $scope.post).then(function() {$scope.checkFlaggedPost();});
        };

        // Expand image on click
        $scope.expandImg = function(title, imagelink) {
            document.getElementById('imgExpand').style.display = 'block';
            $scope.imagelink = imagelink;
            $scope.title = title;
        };

        // Unexpand image
        $scope.unexpandImg = function() {
            document.getElementById('imgExpand').style.display='none';
            $scope.imagelink = '';
            $scope.title = '';
        };

        // Expand delete modal on click
        $scope.deleteComCheck = function(comment) {
            document.getElementById('delcomcheck').style.display = 'block';
            $scope.curComment = comment;
        };
    }]);

// Auth Controller
app.controller('AuthCtrl', ['$scope', '$state', '$window', 'auth',
    function($scope, $state, $window, auth) {
        $scope.user = {};
        $scope.register = function() {
            console.log($scope.user);
            auth.register($scope.user).error(function(error) {
                console.log("Error in angularApp.js");
                $scope.error = error;
            }).then(function() {
                auth.logOut();
                $state.go('verify');
            });
        };
        $scope.logIn = function() {
            auth.logIn($scope.user).error(function(error) {
                $scope.error = error;
            }).then(function() {
                auth.getUserMood(auth.currentUserId()).then(function() {
                    auth.getUserStatus(auth.currentUserId()).then(function() {
                        $window.location.reload(); // Reload entire page to update Angular variables in sidebar
                    });
                });
            });
        };
        $scope.verifyNow = function() {
            auth.verify($scope.code).error(function(error) {
                $scope.error = error;
                $scope.success = false;
            }).success(function(msg){
                $scope.success = msg;
                $scope.error = false;
            });
        };
    }]);

// Navbar Controller
app.controller('NavCtrl', ['$scope', '$state', 'auth',
    function($scope, $state, auth) {
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.currentUserId = auth.currentUserId;
        $scope.logOut = function() {
            auth.logOut();
            $state.reload(); // Reload state so logged out view doesn't contain user info
        }
    }]);

// Sidebar Controller
app.controller('SidebarCtrl', ['$scope', 'auth', 'socialinfo', 'usermoodinfo', 'userstatusinfo',
    function($scope, auth, socialinfo, usermoodinfo, userstatusinfo) {

        // Wait until we get the social mood info...then render the chart
        socialinfo.then(function(data) {
            auth.socialmood = data.data;
            $scope.currentSocialMood = auth.socialmood;

            // Get percentages of each mood
            var percent = calculate_mood(auth.socialmood[0]);

            // Create chart
            var chart = create_chart(percent);

            // Draw chart
            chart.on('draw', function(data) {
                draw_chart(data);
            });

            // Dynamically update chart every few seconds with new data
            window.setInterval(function() {
                var percent = calculate_mood(auth.socialmood[0]);
                chart.update({series:[
                    {meta:'Happy: ', value:percent[0]},
                    {meta:'Sad: ', value:percent[1]},
                    {meta:'Angry: ', value:percent[2]}
                ]})
            }, 10000);

            // Redraw when sidebar is toggled
            var toggle = document.getElementById("toggleOn");
            toggle.addEventListener('click', function() {
                var percent = calculate_mood(auth.socialmood[0]);
                chart.update({series:[
                    {meta:'Happy: ', value:percent[0]},
                    {meta:'Sad: ', value:percent[1]},
                    {meta:'Angry: ', value:percent[2]}
                ]});
            });
        });

        // Wait to get user mood info (if logged in upon initial website bootup)
        usermoodinfo.then(function(data) {
            auth.usermood = data.data;
            $scope.currentMood = auth.usermood;
        });

        // Wait to get user status info (if logged in upon initial website bootup)
        userstatusinfo.then(function(data) {
            auth.status = data.data.status;
            $scope.currentStatus = auth.status;
            $scope.currentStatusSaved = auth.statusSaved;
        });

        // The following doesn't rely on service promises
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.currentUserId = auth.currentUserId;
        $scope.currentSocialMood = auth.socialmood;
        $scope.currentMood = auth.usermood; // In case the usermoodinfo promise fails
        $scope.currentStatus = auth.status; // In case the userstatusinfo promise fails
        $scope.currentStatusSaved = auth.statusSaved; // In case the userstatusinfo promise fails
        $scope.copyStatus = '';

        // Check if current mood is equal to the parameter, to help decide which mood button to highlight
        $scope.checkMood = function(moodString) {
            if ($scope.currentMood.length === 0) {
                return false;
            }
            else if ("undefined" === typeof $scope.currentMood[0].mood) {
                return false;
            }
            // Button only gets highlighted if current mood is equal to button mood (new users have nothing highlighted)
            else if ($scope.currentMood[0].mood === moodString) {
                return true;
            }
            else {
                return false;
            }
        };

        // Update user mood
        $scope.setMoodTo = function(moodString) {
            // If same mood as current mood, don't do anything
            if ($scope.currentMood[0].mood === moodString) {
                return;
            }
            // If not new user, decrement social mood count of current mood
            if ($scope.currentMood[0].mood !== 'Select one below!') {
                auth.decrementSocialMood($scope.currentMood[0].mood).then(function(){
                    // Then, set to new mood
                    auth.setUserMood($scope.currentUserId(), moodString).then(function(){
                        // Finally, increment social mood count of newly selected mood
                        auth.incrementSocialMood(moodString);
                    });
                });
            }
            // If new user, then nothing to decrement (the rest remains the same)
            else {
                auth.setUserMood($scope.currentUserId(), moodString).then(function(){
                    auth.incrementSocialMood(moodString);
                });
            }
         };

         // Flip status from saved to update
         $scope.flipStatus = function() {
            $scope.currentStatusSaved = false;
            $scope.copyStatus = angular.copy($scope.currentStatus);
            $scope.$applyAsync(); // Apply changes in view
         };

         // Save status and flip back to saved mode
         $scope.saveStatus = function() {
            auth.setUserStatus($scope.currentUserId(), this.copyStatus).then(function() {
                $scope.currentStatusSaved = true;
                $scope.currentStatus = auth.status;
                $scope.$applyAsync(); // Apply changes in view
            });
         };
    }]);
