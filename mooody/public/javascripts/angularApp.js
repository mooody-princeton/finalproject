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
  $urlRouterProvider.otherwise('home');
}]);

// Factories **********************************************

// Authorization factory, simultaneously takes care of mood tracking
app.factory('auth', ['$http', '$window',
function($http, $window) {
	var auth = {
        usermood: [],
        socialmood: []
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
            });
    };
    o.downvote = function(userid, post) {
        return $http.put('/posts/' + post._id + '/downvote', {usr: userid}, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
	    }).success(function(data){
            post.flags = data.userFlags.length;
	        });
	};
    o.get = function(id) {
        return $http.get('/posts/' + id).then(function(res){
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
        });
    };
    o.downvoteComment = function(userid, post, comment) {
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/downvote', {usr: userid}, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function(data){
            comment.flags = data.userFlags.length;
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

// Controllers ********************************************

// Main Controller (home page)
app.controller('MainCtrl', ['$scope', 'posts', 'auth',
    function($scope, posts, auth) {
        $scope.posts = posts.posts;
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.title = '';
        $scope.body = '';

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
        $scope.active_hot = 'w3-border-inactive';
        $scope.active_new = 'w3-border-blue';

        // Add post
        $scope.addPost = function() {
            if (!$scope.title || $scope.title === '') { return; }
            posts.create({
                title: $scope.title,
                body: $scope.body,
                mood: $scope.filters.mood,
                date: new Date()
            });
            $scope.title = '';
            $scope.body = '';
        };

        // Upvote post
        $scope.incrementUpvotes = function(post) {
            posts.upvote(auth.currentUserId(), post);
        };

        // Flag post
        $scope.incrementFlags = function(post) {
            posts.downvote(auth.currentUserId(), post);
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
            }
            else if (tab === 'sad') {
                $scope.filters.mood = 'sad';
                $scope.placeholder = 'Why are you sad?'
                $scope.inFilter = true;
                $scope.active_h = 'w3-border-inactive';
                $scope.active_s = 'w3-border-blue';
                $scope.active_a = 'w3-border-inactive';
            }
            else if (tab === 'angry') {
                $scope.filters.mood = 'angry';
                $scope.placeholder = 'Why are you angry?'
                $scope.inFilter = true;
                $scope.active_h = 'w3-border-inactive';
                $scope.active_s = 'w3-border-inactive';
                $scope.active_a = 'w3-border-red';
            }
            else {
                $scope.filters = {};
                $scope.placeholder = 'Filter by mood in order to post'
                $scope.inFilter = false;
                $scope.active_h = 'w3-border-inactive';
                $scope.active_s = 'w3-border-inactive';
                $scope.active_a = 'w3-border-inactive';
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
        }
    }]);

// Posts Controller
app.controller('PostsCtrl', ['$scope', 'posts', 'post', 'auth',
    function($scope, posts, post, auth) {
        $scope.post = post;
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.addComment = function() {
            if ($scope.body === '') { return; }
            posts.addComment(post._id, {
                body: $scope.body,
            }).success(function(comment) {
                $scope.post.comments.push(comment);
            });
          $scope.body = '';
        };
        $scope.incrementUpvotes = function(comment) {
            posts.upvoteComment(auth.currentUserId(), post, comment);
        };
        $scope.incrementFlags = function(comment) {
            posts.downvoteComment(auth.currentUserId(), post, comment);
        };
    }]);

// Auth Controller
app.controller('AuthCtrl', ['$scope', '$state', 'auth',
    function($scope, $state, auth) {
        $scope.user = {};
        $scope.register = function() {
            console.log($scope.user);
            auth.register($scope.user).error(function(error) {
                console.log("Error in angularApp.js");
                $scope.error = error;
            }).then(function() {
                auth.getUserMood(auth.currentUserId()).then(function() {$state.go('home');});
            });
        };
        $scope.logIn = function() {
            auth.logIn($scope.user).error(function(error) {
                $scope.error = error;
            }).then(function() {
                auth.getUserMood(auth.currentUserId()).then(function() {$state.go('home');});
            });
        };
    }]);

// Navbar Controller
app.controller('NavCtrl', ['$scope', 'auth',
    function($scope, auth) {
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.currentUserId = auth.currentUserId;
        $scope.logOut = auth.logOut;
    }]);

// Sidebar Controller
app.controller('SidebarCtrl', ['$scope', 'auth', 'socialinfo', 'usermoodinfo',
    function($scope, auth, socialinfo, usermoodinfo) {
        // Wait until we get the social mood info...
        socialinfo.then(function(data) {
            auth.socialmood = data.data;
            $scope.currentSocialMood = auth.socialmood;

            // Create chart
            var chart = new Chartist.Pie('.ct-chart', {
              series: [auth.socialmood[0].happy, auth.socialmood[0].sad, auth.socialmood[0].angry],
              labels: ["happy", "angry", "sad"]
            }, {
              donut: true,
              showLabel: false
            });

            // Draw chart
            chart.on('draw', function(data) {
              if(data.type === 'slice') {
                // Get the total path length in order to use for dash array animation
                var pathLength = data.element._node.getTotalLength();
                // Set a dasharray that matches the path length as prerequisite to animate dashoffset
                data.element.attr({
                  'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
                });
                // Create animation definition while also assigning an ID to the animation for later sync usage
                var animationDefinition = {
                  'stroke-dashoffset': {
                    id: 'anim' + data.index,
                    dur: 1000,
                    from: -pathLength + 'px',
                    to:  '0px',
                    easing: Chartist.Svg.Easing.easeOutQuint,
                    // We need to use `fill: 'freeze'` otherwise our animation will fall back to initial (not visible)
                    fill: 'freeze'
                  }
                };
                // If this was not the first slice, we need to time the animation so that it uses the end sync event of the previous animation
                if(data.index !== 0) {
                  animationDefinition['stroke-dashoffset'].begin = 'anim' + (data.index - 1) + '.end';
                }
                // We need to set an initial value before the animation starts as we are not in guided mode which would do that for us
                data.element.attr({
                  'stroke-dashoffset': -pathLength + 'px'
                });
                // We can't use guided mode as the animations need to rely on setting begin manually
                // See http://gionkunz.github.io/chartist-js/api-documentation.html#chartistsvg-function-animate
                data.element.animate(animationDefinition, false);
              }
            });

            // Dynamically update chart every few seconds with new data
            window.setInterval(function() {chart.update({series:[auth.socialmood[0].happy, auth.socialmood[0].sad, auth.socialmood[0].angry]})}, 10000);
        });

        // Wait to get user info (if logged in upon initial website bootup)
        usermoodinfo.then(function(data) {
            auth.usermood = data.data;
            $scope.currentMood = auth.usermood;
        });

        // The following doesn't rely on service promises
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.currentUserId = auth.currentUserId;
        $scope.currentSocialMood = auth.socialmood;
        $scope.currentMood = auth.usermood; // In case the usermoodinfo promise fails

        // Check if current mood is equal to the parameter, to help decide which mood button to highlight
        $scope.checkMood = function(moodString) {
            // Button only gets highlighted if current mood is equal to button mood (new users have nothing highlighted)
            if ($scope.currentMood[0].mood === moodString) {
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
    }]);
