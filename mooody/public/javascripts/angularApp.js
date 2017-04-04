angular.module('mooody', ['ui.router'])

var app = angular.module('mooody', ['ui.router']);

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

// Authorization module
app.factory('auth', ['$http', '$window',
function($http, $window) {
	var auth = {};
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

	return auth;
}]);

// Posting module
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

// Main Controller
app.controller('MainCtrl', ['$scope', 'posts', 'auth',
    function($scope, posts, auth) {
        // $scope.posts = posts.posts;
        // Comment below out when backend is ready
        $scope.posts = [
            {title:"test1-h", upvotes:10, flags:3, mood:"happy", time:new Date("October 13, 2014 11:13:00")},
            {title:"test2-h", upvotes:2, flags:3, mood:"happy", time:new Date("October 13, 2014 11:14:00")},
            {title:"test3-h", upvotes:2, flags:3, mood:"happy", time:new Date("October 13, 2014 11:15:00")},
            {title:"test4-h", upvotes:4, flags:3, mood:"happy", time:new Date("October 13, 2014 11:16:00")},
            {title:"test5-h", upvotes:2, flags:3, mood:"happy", time:new Date("October 13, 2014 11:17:00")},
            {title:"test1-s", upvotes:2, flags:3, mood:"sad", time:new Date("October 14, 2014 11:13:00")},
            {title:"test2-s", upvotes:2, flags:3, mood:"sad", time:new Date("October 14, 2014 11:14:00")},
            {title:"test3-s", upvotes:11, flags:3, mood:"sad", time:new Date("October 14, 2014 11:15:00")},
            {title:"test4-s", upvotes:2, flags:3, mood:"sad", time:new Date("October 14, 2014 11:16:00")},
            {title:"test5-s", upvotes:1, flags:3, mood:"sad", time:new Date("October 14, 2014 11:17:00")},
            {title:"test1-a", upvotes:2, flags:3, mood:"angry", time:new Date("October 11, 2014 11:13:00")},
            {title:"test2-a", upvotes:0, flags:3, mood:"angry", time:new Date("October 11, 2014 11:14:00")},
            {title:"test3-a", upvotes:2, flags:3, mood:"angry", time:new Date("October 11, 2014 11:15:00")},
            {title:"test4-a", upvotes:3, flags:3, mood:"angry", time:new Date("October 11, 2014 11:16:00")},
            {title:"test5-a", upvotes:4, flags:3, mood:"angry", time:new Date("October 11, 2014 11:17:00")},
        ];
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.title = '';
        $scope.filters = {};
        $scope.orders = '-time';

        // Add post
        $scope.addPost = function() {
            if (!$scope.title || $scope.title === '') { return; }

            posts.create({
                title: $scope.title,
            });
            $scope.title = '';
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
            console.log("In mood tab filter");
            console.log(tab);
            if (tab === 'happy') {
                $scope.filters.mood = 'happy';
            }
            else if (tab === 'sad') {
                $scope.filters.mood = 'sad';
            }
            else if (tab === 'angry') {
                $scope.filters.mood = 'angry';
            }
            else if (tab === 'new') {
                $scope.orders = "-time";
            } else if (tab === 'hot') {
                $scope.orders = "-upvotes";
            }
            else {
                $scope.filters = {};
            }
            //$scope.posts = posts.posts;
            console.log($scope.filters.mood);
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

// Nav Controller
app.controller('NavCtrl', ['$scope', 'auth',
    function($scope, auth) {
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;
    }]);
