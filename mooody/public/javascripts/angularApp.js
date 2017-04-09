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
        console.log("In auth.logIn in angularApp.js");
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
    o.upvote = function(post) {
        return $http.put('/posts/' + post._id + '/upvote', null, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data) {
            post.upvotes += 1;
            });
    };
    o.downvote = function(post) {
        return $http.put('/posts/' + post._id + '/downvote', null, {
            headers: {Authorization: 'Bearer '+auth.getToken()}
	  }).success(function(data){
          post.flags += 1;
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
    o.upvoteComment = function(post, comment) {
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function(data){
            comment.upvotes += 1;
        });
    };
    o.downvoteComment = function(post, comment) {
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/downvote', null, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function(data){
            comment.flags += 1;
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

// Controllers ********************************************

// Main Controller (home page)
app.controller('MainCtrl', ['$scope', 'posts', 'auth',
    function($scope, posts, auth) {
        $scope.posts = posts.posts;
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.title = '';
        $scope.body = '';
        $scope.filters = {};
        $scope.filters.mood = 'happy'
        $scope.orders = '-date';
        $scope.placeholder = 'Why are you happy?'
        $scope.inFilter = true;

        // Initialize toggle for new/hot posts
        $('#order-toggle').bootstrapToggle();

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
            posts.upvote(post);
        };

        // Flag post
        $scope.incrementFlags = function(post) {
            posts.downvote(post);
        };

        // Filter posts by mood
        $scope.tab = function(tab) {
            if (tab === 'happy') {
                $scope.filters.mood = 'happy';
                $scope.placeholder = 'Why are you happy?'
                $scope.inFilter = true;
            }
            else if (tab === 'sad') {
                $scope.filters.mood = 'sad';
                $scope.placeholder = 'Why are you sad?'
                $scope.inFilter = true;
            }
            else if (tab === 'angry') {
                $scope.filters.mood = 'angry';
                $scope.placeholder = 'Why are you angry?'
                $scope.inFilter = true;
            }
            else {
                $scope.filters = {};
                $scope.placeholder = 'Filter by mood in order to post'
                $scope.inFilter = false;
            }
            $scope.posts = posts.posts;
        };

        // Toggle posts by date or upvotes
        $scope.toggle = function() {
            if ($('#order-toggle').prop('checked') == true) {
                $scope.orders = '-upvotes';
            }
            else {
                $scope.orders = '-date';
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
            posts.upvoteComment(post, comment);
        };
        $scope.incrementFlags = function(comment) {
            posts.downvoteComment(post, comment);
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
                $state.go('home');
            });
        };
        $scope.logIn = function() {
            auth.logIn($scope.user).error(function(error) {
                $scope.error = error;
            }).then(function() {
                $state.go('home');
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
app.controller('SidebarCtrl', ['$scope', 'auth', 'socialinfo',
    function($scope, auth, socialinfo) {
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

        // END CHART DATA

        // The following doesn't rely on the socialinfo service's promise
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.currentUserId = auth.currentUserId;
        $scope.currentMood = auth.usermood;

        // Update user mood
        $scope.setMoodTo = function(moodString) {
            // If same mood as current mood, don't do anything
            if ($scope.currentMood[0].mood == moodString) {
                return;
            }
            // If not new user, decrement social mood count of current mood
            if ($scope.currentMood[0].mood != 'Select one below!') {
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
