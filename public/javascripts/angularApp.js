var app = angular.module('mooody', ['ui.router', 'angular-spinkit']);

app.run(function($rootScope) {
    $rootScope.previousState;
    $rootScope.currentState;
    $rootScope.scrollPos;
    $rootScope.tabPos = {};
    $rootScope.tabPos.mood = 'happy';
    $rootScope.tabPos.orders = '-date';
    $rootScope.searchingstring = '';
    $rootScope.searchingfilter = '';

    $rootScope.$on('$stateChangeStart', function() {
        // Store scroll position and current tabs for the view
        // Only for home state
        if ($rootScope.currentState === 'home') {
            $rootScope.scrollPos = $(document).scrollTop();
        }

        // Loading spinner
        $('#main-cont').css('visibility', 'hidden');
        $rootScope.isStateLoading = true;
    });
    $rootScope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
        $rootScope.previousState = from.name;
        $rootScope.currentState = to.name;

        // Loading spinner
        $rootScope.isStateLoading = false;
        $('#main-cont').css('visibility', '');
        console.log('Prev: ' + $rootScope.previousState);
        console.log('Curr: ' + $rootScope.currentState);
    });
});

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
        onEnter : ['$timeout', '$state', 'auth',
    		function($timeout, $state, auth) {
    			if (auth.isLoggedIn()) {
                    $timeout(function() { // Let onEnter's transition finish first, to avoid screw up, before starting a new transition
                           $state.go('home');
                        },0);
    			}
            }]
    });
    $stateProvider.state('register', {
        url : '/register',
        templateUrl : '/register.html',
        controller : 'AuthCtrl',
        onEnter : ['$timeout', '$state', 'auth',
            function($timeout, $state, auth) {
                if (auth.isLoggedIn()) {
                    $timeout(function() {
                           $state.go('home');
                        },0);
                }
            }]
    });
    $stateProvider.state('verify', {
        url : '/verify',
        templateUrl : '/verify.html',
        controller : 'AuthCtrl',
        onEnter : ['$timeout', '$state', 'auth',
            function($timeout, $state, auth) {
                if (auth.isLoggedIn()) {
                    $timeout(function() {
                           $state.go('home');
                        },0);
                }
            }]
    });
    $stateProvider.state('mymessages', {
      url: '/mymessages/{id}',
      templateUrl: '/mymessages.html',
      controller: 'MsgCtrl',
      onEnter : ['$timeout', '$state', '$stateParams', 'auth',
            function($timeout, $state, $stateParams, auth) {
                if (!auth.isLoggedIn()) {
                    $timeout(function() {
                           $state.go('home');
                        },0);
                }
                else if (auth.currentUserId() != $stateParams.id) {
                    $timeout(function() {
                           $state.go('home');
                        },0);
                }
            }],
      resolve: {
          notes: ['$stateParams', 'auth', function($stateParams, auth) {
              return auth.getNotes($stateParams.id);
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
    $stateProvider.state('mymoodtracker', {
        url: '/mymoodtracker/{id}/{mode}',
        templateUrl: '/mymoodtracker.html',
        controller: 'TrackerCtrl',
        onEnter : ['$timeout', '$state', '$stateParams', 'auth',
            function($timeout, $state, $stateParams, auth) {
                if (!auth.isLoggedIn()) {
                    $timeout(function() {
                           $state.go('home');
                        },0);
                }
                else if (auth.currentUserId() != $stateParams.id) {
                    $timeout(function() {
                           $state.go('home');
                        },0);
                }
                else if ($stateParams.mode != "go" && $stateParams.mode != "stay") {
                    $timeout(function() {
                           $state.go('home');
                        },0);
                }
            }],
        resolve: {
            checkRedirection: ['$stateParams', 'auth', function($stateParams, auth) {
                // If mode is go and the user already entered data today, redirect to mood charts
                if ($stateParams.mode == "go") {
                    return auth.trackedToday($stateParams.id);
                }
            }]
        }
    });
    $stateProvider.state('mymoodcharts', {
        url: '/mymoodcharts/{id}',
        templateUrl: '/mymoodcharts.html',
        controller: 'ChartsCtrl',
        onEnter : ['$timeout', '$state', '$stateParams', 'auth',
            function($timeout, $state, $stateParams, auth) {
                if (!auth.isLoggedIn()) {
                    $timeout(function() {
                           $state.go('home');
                        },0);
                }
                else if (auth.currentUserId() != $stateParams.id) {
                    $timeout(function() {
                           $state.go('home');
                        },0);
                }
            }],
        resolve: {
          moodataPromise: ['$stateParams', 'auth', function($stateParams, auth) {
              return auth.getMoodata($stateParams.id);
          }]
        }
    });
  $urlRouterProvider.otherwise('home');

}]);

// Factories **********************************************

// Authorization factory, simultaneously takes care of mood tracking and other user functionalities
app.factory('auth', ['$http', '$timeout', '$state', '$window',
function($http, $timeout, $state, $window) {
	var auth = {
        usermood: [],
        socialmood: [],
        status: String,
        statusSaved: Boolean,
        notes: [],
        notesEmpty: Boolean
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
	// auth.currentUser = function() {
	// 	if (auth.isLoggedIn()) {
	// 		var token = auth.getToken();
	// 		var payload = JSON.parse($window.atob(token.split('.')[1]));

	// 		return payload.username;
	// 	}
	// };
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
    // Return random user who's feeling low and who's not the current user
    auth.selectRandomUser = function(userid) {
        return $http.put('/randomuser', {curruser: userid}, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
            }).then(function(res) {
                return res.data;
        });
    };
    // Return another random user who's feeling low and who's not the current user
    auth.selectAnotherUser = function(userid, providedid) {
        return $http.put('/randomusernext', {curruser: userid, provuser: providedid}, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
            }).then(function(res) {
                return res.data;
        });
    };
    // Create a note
    auth.createMessage = function(msg) {
        return $http.post('/messages', msg, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        });
    };
    // Get all notes for a user
    auth.getNotes = function(userid) {
        return $http.get('/allnotes/' + userid, null, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        }).then(function(res) {
            angular.copy(res.data, auth.notes);
            if (res.data[0].author == "Dummy string" && res.data[0].body == "Dummy string") {
                auth.notesEmpty = true;
            }
            else {
                auth.notesEmpty = false;
            }
        });
    };
    // Delete a message
    auth.deleteMessage = function(userid, note) {
        return $http.put('/notes/' + note._id + '/delete', {usr: userid}, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        }).success(function(data) {
            note.deleted = data.deleted;
            });
    };
    // Create a new mood data entry
    auth.createMoodata = function(moodata) {
        return $http.post('/moodata', moodata, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        });
    };
    // Did the user enter a mood data entry today? If so, redirect
    auth.trackedToday = function(userid) {
        $http.put('/trackedtoday', {curruser: userid}, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        }).then(function(res) {
            console.log(res.data[0].doneToday);
            console.log(res.data[0].teststring);
            if (res.data[0].doneToday) {
                $timeout(function() {
                    $state.go('mymoodcharts', {id: userid});
                    },0);
                return;
            }
            else {return;}
        });
    };
    // Fetch user's mood data (array of entries)
    auth.getMoodata = function(userid) {
        return $http.get('/showmoodata/' + userid, null, {
            headers: { Authorization: 'Bearer ' + auth.getToken()}
        }).error(function(error) {
            console.log(error);
            $timeout(function() {
                $state.go('home');
                },0);
        }).then(function(res) {
            return res.data[0];
        });
    };
    return auth;
}]);

// Posts factory
app.factory('posts', ['$http', '$timeout', '$state', 'auth', function($http, $timeout, $state, auth) {
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
        return $http.get('/posts/' + id).error(function(error) {
                $timeout(function() {
                    $state.go('home');
                    },0);
            }).then(function(res) {
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
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/delete', {usr: userid, commentid: comment._id}, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function(data){
            comment.deleted = data.comment.deleted;
        });
    };
    o.downvoteComment = function(userid, post, comment) {
        return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/downvote', {usr: userid}, {
            headers: { Authorization: 'Bearer ' + auth.getToken() }
        }).success(function(data){
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
app.controller('MainCtrl', ['$scope', '$rootScope', '$http', 'posts', 'auth',
    function($scope, $rootScope, $http, posts, auth) {
        $scope.posts = posts.posts;
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.title = '';
        $scope.imagelink = '';
        //$scope.currentUser = auth.currentUser;
        $scope.currentUserId = auth.currentUserId;
        $scope.popupImg = 'https://www.jainsusa.com/images/store/landscape/not-available.jpg';
        $scope.imageNA = 'https://www.jainsusa.com/images/store/landscape/not-available.jpg';

        // Filter by mood and order by date/popularity
        // $scope.filters = {};
        // // $scope.filters.mood = 'happy'
        // // $rootScope.tabPos.mood = 'happy';
        // // $scope.orders = '-date';
        // // $rootScope.tabPos.orders = 'new';
        // $scope.inFilter = true;
        $scope.filters = {};
        $scope.filters.mood = $rootScope.tabPos.mood;
        $scope.orders = $rootScope.tabPos.orders;
        $scope.inFilter;
        $scope.searchstring = $rootScope.searchingstring;
        $scope.searchfilter = $rootScope.searchingfilter;

        if ($rootScope.tabPos.mood === 'happy') {
            $scope.placeholder = 'What makes you happy?'
            $scope.active_h = 'w3-border-yellow';
            $scope.active_s = 'w3-border-inactive';
            $scope.active_a = 'w3-border-inactive';
            $scope.active_all = '';
            $scope.inFilter = true;
        } else if ($rootScope.tabPos.mood === 'sad') {
            $scope.placeholder = 'What makes you sad?'
            $scope.active_h = 'w3-border-inactive';
            $scope.active_s = 'w3-border-blue';
            $scope.active_a = 'w3-border-inactive';
            $scope.active_all = '';
            $scope.inFilter = true;
        } else if ($rootScope.tabPos.mood === 'angry') {
            $scope.placeholder = 'What makes you angry?'
            $scope.active_h = 'w3-border-inactive';
            $scope.active_s = 'w3-border-inactive';
            $scope.active_a = 'w3-border-red';
            $scope.active_all = '';
            $scope.inFilter = true;
        } else {
            $scope.filters = {};
            $scope.placeholder = 'Filter by mood in order to post'
            $scope.inFilter = false;
            $scope.active_h = 'w3-border-inactive';
            $scope.active_s = 'w3-border-inactive';
            $scope.active_a = 'w3-border-inactive';
            $scope.active_all = 'w3-gray';
        }

        if ($rootScope.tabPos.orders === '-date') {
            $scope.active_hot = 'w3-border-inactive';
            $scope.active_new = 'w3-border-blue';
        } else {
            $scope.active_hot = 'w3-border-red';
            $scope.active_new = 'w3-border-inactive';
        }

        // Highlight tabs
        // $scope.active_h = 'w3-border-yellow';
        // $scope.active_s = 'w3-border-inactive';
        // $scope.active_a = 'w3-border-inactive';
        // $scope.active_all = 'w3-border-inactive';
        // $scope.active_hot = 'w3-border-inactive';
        // $scope.active_new = 'w3-border-blue';

        // Create a post
        $scope.createPost = function() {
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
            $scope.posts = posts.posts;
        };

        // Validate an image URL, creating a post afterwards if createAfter is true
        $scope.validateImgLink = function(stringURL, createAfter) {
            // Is it a string?
            if (typeof(stringURL) != 'string') {
                $scope.imagelink = $scope.imageNA;
                if (createAfter) $scope.createPost();
            }
            // Is it a URL?
            else if (!stringURL.startsWith('http://') && !stringURL.startsWith('https://')) {
                $scope.imagelink = $scope.imageNA;
                if (createAfter) $scope.createPost();
            }
            // Does it end with the allowed extensions? (commented out: many images don't end with their extensions)
            // else if (!stringURL.endsWith('.jpg') && !stringURL.endsWith('.jpeg') && !stringURL.endsWith('.png') && !stringURL.endsWith('.gif')) {
            //     $scope.imagelink = $scope.imageNA;
            //     if (createAfter) $scope.createPost();
            // }
            else {
                // Is the URL safe (using Google's Safe Browsing API)?
                var body = {
                    "client": {
                        "clientId": "mooodyapp",
                        "clientVersion": "1.0"
                    },
                    "threatInfo": {
                        "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
                        "platformTypes": ["ANY_PLATFORM"],
                        "threatEntryTypes": ["URL", "EXECUTABLE"],
                        "threatEntries": [
                        {"url": stringURL}
                      ]
                    }
                };
                $http({
                    method:'POST',
                    url: "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=AIzaSyDGjERzAHkvx-iGMxVzNwP9imGNocU1IIQ",
                    data: body,
                    headers: {
                      "Content-Type": "application/json"
                    }
                  }).error(function(error) {
                        console.log(error);
                        $scope.imagelink = $scope.imageNA;
                        if (createAfter) $scope.createPost();
                    }).success(function(data) {
                        console.log(data);
                        console.log(!_.isEmpty(data));
                        if (!_.isEmpty(data)) {
                            $scope.imagelink = $scope.imageNA;
                            if (createAfter) $scope.createPost();
                        }
                        else {
                            if (createAfter) $scope.createPost();
                        }
                });
            }
        };

        // Add post
        $scope.addPost = function() {
            if (!$scope.title || $scope.title === '' || !$scope.isLoggedIn()) return;
            else if (typeof($scope.title) != 'string') return;

            // Take care of image
            else if ((!$scope.imagelink) == false) {
                if (typeof($scope.imagelink) != "string") return;
                // Validate image URL
                else {
                    // Will post after checking
                    $scope.validateImgLink($scope.imagelink, true);
                }
            }
            // If no image, just post right away
            else {
                $scope.createPost();
            }
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
            if (!$scope.isLoggedIn()) return; 
            else {
                posts.upvote(auth.currentUserId(), post).then(function() {$scope.checkUpvoted(post);});
            }
        };

        // Delete post
        $scope.deletePost = function(post) {
            if (!$scope.isLoggedIn()) return; 
            else {
                posts.delete(auth.currentUserId(), post);
            }
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
            if (!$scope.isLoggedIn()) return;
            else {
                posts.downvote(auth.currentUserId(), post).then(function() {$scope.checkFlagged(post);});
            }
        };

        // Filter posts by mood
        $scope.tab = function(tab) {
            if (tab === 'happy') {
                $scope.filters.mood = 'happy';
                $scope.placeholder = 'What makes you happy?'
                $scope.inFilter = true;
                $scope.active_h = 'w3-border-yellow';
                $scope.active_s = 'w3-border-inactive';
                $scope.active_a = 'w3-border-inactive';
                $scope.active_all = '';
                $rootScope.tabPos.mood = 'happy';
            }
            else if (tab === 'sad') {
                $scope.filters.mood = 'sad';
                $scope.placeholder = 'What makes you sad?'
                $scope.inFilter = true;
                $scope.active_h = 'w3-border-inactive';
                $scope.active_s = 'w3-border-blue';
                $scope.active_a = 'w3-border-inactive';
                $scope.active_all = '';
                $rootScope.tabPos.mood = 'sad';
            }
            else if (tab === 'angry') {
                $scope.filters.mood = 'angry';
                $scope.placeholder = 'What makes you angry?'
                $scope.inFilter = true;
                $scope.active_h = 'w3-border-inactive';
                $scope.active_s = 'w3-border-inactive';
                $scope.active_a = 'w3-border-red';
                $scope.active_all = '';
                $rootScope.tabPos.mood = 'angry';
            }
            else {
                $scope.filters = {};
                $scope.placeholder = 'Filter by mood in order to post'
                $scope.inFilter = false;
                $scope.active_h = 'w3-border-inactive';
                $scope.active_s = 'w3-border-inactive';
                $scope.active_a = 'w3-border-inactive';
                $scope.active_all = 'w3-gray';
                $rootScope.tabPos.mood = 'all';
            }
            $scope.posts = posts.posts;
        };

        // Toggle posts by date or upvotes
        $scope.toggle = function(order) {
            if (order == 'hot') {
                $scope.orders = '-upvotes';
                $scope.active_hot = 'w3-border-red';
                $scope.active_new = 'w3-border-inactive';
                $rootScope.tabPos.orders = '-upvotes';
            }
            else {
                $scope.orders = '-date';
                $scope.active_hot = 'w3-border-inactive';
                $scope.active_new = 'w3-border-blue';
                $rootScope.tabPos.orders = '-date';
            }
        };

        // Determine whether to disable "Post" button based on filter
        $scope.isInFilter = function() {
            return $scope.inFilter;
        };

        // Apply search string to filter posts
        $scope.applySearch = function() {
            $scope.searchfilter = $scope.searchstring;
            $rootScope.searchingstring = $scope.searchstring;
            $rootScope.searchingfilter = $scope.searchfilter;
            $scope.$applyAsync();
        };

        // Clear search
        $scope.clearSearch = function() {
            $scope.searchstring = '';
            $scope.searchfilter = '';
            $rootScope.searchingstring = '';
            $rootScope.searchingfilter = '';
            $scope.$applyAsync();
        };

        // Expand image on click
        $scope.expandImg = function(title, imagelink) {
            $scope.popupImg = imagelink;
            $scope.title = title;
	        document.getElementById('imgExpand').style.display = 'block';
        };

        // Unexpand image
        $scope.unexpandImg = function() {
            document.getElementById('imgExpand').style.display='none';
            $scope.popupImg = 'https://www.jainsusa.com/images/store/landscape/not-available.jpg';
            $scope.title = '';
        };

        // Expand delete modal on click
        $scope.deleteCheck = function(post) {
            if (!$scope.isLoggedIn()) return;
            else {
                document.getElementById('delcheck').style.display = 'block';
                $scope.curPost = post;
            }
        };

        // Expand flag modal on click
        $scope.flagCheck = function(post) {
            if (!$scope.isLoggedIn()) return;
            else {
                document.getElementById('flagcheck').style.display = 'block';
                $scope.curPost = post;
            }
        };
    }]);

// Posts Controller
app.controller('PostsCtrl', ['$scope', '$state', '$rootScope', 'posts', 'post', 'auth',
    function($scope, $state, $rootScope, posts, post, auth) {
        $scope.post = post;
        $scope.isLoggedIn = auth.isLoggedIn;
        //$scope.currentUser = auth.currentUser;
        $scope.currentUserId = auth.currentUserId;
        $scope.popupImg = 'https://www.jainsusa.com/images/store/landscape/not-available.jpg';

        $scope.addComment = function() {
            if (!$scope.body || $scope.body === '' || !$scope.isLoggedIn()) { return; }
            else if (typeof($scope.body) != 'string') return;

            else {
                posts.addComment(post._id, {
                    body: $scope.body,
                    authorid: auth.currentUserId(),
                }).success(function(comment) {
                    $scope.post.comments.push(comment);
                    $scope.post.commenters = comment.post.commenters;
                    $scope.post.commenterNumber = comment.post.commenterNumber;
                    $scope.$applyAsync();
                });
                $scope.body = '';
            }
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
            if (!$scope.isLoggedIn()) return;
            else {
                posts.upvoteComment(auth.currentUserId(), post, comment).then(function() {$scope.checkUpvoted(comment);});
            }
        };

        // Delete a comment
        $scope.deleteComment = function(comment) {
            if (!$scope.isLoggedIn()) return;
            else {
                posts.deleteComment(auth.currentUserId(), post, comment);
                $scope.$applyAsync();
            }
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
            if (!$scope.isLoggedIn()) return;
            else {
                posts.downvoteComment(auth.currentUserId(), post, comment).then(function() {$scope.checkFlagged(comment);});
            }
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
            if (!$scope.isLoggedIn()) return;
            else {
                posts.upvote(auth.currentUserId(), $scope.post).then(function() {$scope.checkUpvotedPost();});
            }
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
            if (!$scope.isLoggedIn()) return;
            else {
                posts.downvote(auth.currentUserId(), $scope.post).then(function() {$scope.checkFlaggedPost();});
            }
        };

        // Expand image on click
        $scope.expandImg = function(title, imagelink) {
            $scope.popupImg = imagelink;
            $scope.title = title;
            document.getElementById('imgExpand').style.display = 'block';
        };

        // Unexpand image
        $scope.unexpandImg = function() {
            document.getElementById('imgExpand').style.display='none';
            $scope.popupImg = 'https://www.jainsusa.com/images/store/landscape/not-available.jpg';
            $scope.title = '';
        };

        // Expand delete modal on click
        $scope.deleteComCheck = function(comment) {
            if (!$scope.isLoggedIn()) return;
            else {
                document.getElementById('delcomcheck').style.display = 'block';
                $scope.curComment = comment;
            }
        };

        // Expand flag modal on click
        $scope.flagCheck = function(post) {
            if (!$scope.isLoggedIn()) return;
            else {
                document.getElementById('flagcheck2').style.display = 'block';
                $scope.curPost = post;
            }
        };

        // Expand flag modal on click
        $scope.flagComCheck = function(comment) {
            if (!$scope.isLoggedIn()) return;
            else {
                document.getElementById('flagcomcheck').style.display = 'block';
                $scope.curComment = comment;
            }
        };

        // State-saving
        $scope.goBack = function() {
            if ($rootScope.previousState === '') {
                $state.go('home');
            }
            else if ($rootScope.previousState === 'home') {
                $state.go('home');
                $('html, body').animate({scrollTop:$rootScope.scrollPos}, 100);
            }
            else {
                $state.go('home');
            }
        };
    }]);

// Auth Controller
app.controller('AuthCtrl', ['$scope', '$state', '$window', 'auth',
    function($scope, $state, $window, auth) {
        $scope.user = {};
        $scope.user.email = '';
        $scope.error = '';
        $scope.frontenderror = '';
        $scope.confirmation = '';

        $scope.register = function() {
            if (!$scope.user.password || !$scope.user.netid || !$scope.confirmation) return;
            if (typeof($scope.user.password) != "string" || typeof($scope.user.netid) != "string" || typeof($scope.confirmation) != "string") return;
            if ((!$scope.user.optional) == false) {
                if (typeof($scope.user.optional) != "string") {
                    return;
                }
            }
            if ($scope.user.password != $scope.confirmation) {
                $scope.error = '';
                $scope.frontenderror = 'Your confirmation password does not match.';
                $scope.user.password = '';
                $scope.confirmation = '';
                return;
            }
            console.log($scope.user);
            auth.register($scope.user).error(function(error) {
                console.log("Error in angularApp.js");
                $scope.frontenderror = '';
                $scope.error = error;
                return;
            }).then(function() {
                auth.logOut(); // Must verify first before being able to log in
                $state.go('verify');
            });
        };

        $scope.logIn = function() {
            if (!$scope.user.netid || !$scope.user.password) return;
            if (typeof($scope.user.netid) != "string" || typeof($scope.user.password) != "string") return;
            if ((!$scope.user.optional) == false) {
                if (typeof($scope.user.optional) != "string") return;
            }

            var tempString = '';
            if ($scope.user.hasOwnProperty('optional') && "undefined" !== typeof $scope.user.optional) {
              tempString = $scope.user.optional;
            }
            $scope.user.email = $scope.user.netid + "@" + tempString + "princeton.edu";

            auth.logIn($scope.user).error(function(error) {
                $scope.error = error;
            }).then(function() {
                auth.getUserMood(auth.currentUserId()).then(function() {
                    auth.getUserStatus(auth.currentUserId()).then(function() {
                        $scope.user.email = '';
                        $window.location.reload(); // Reload entire page to update Angular variables in sidebar
                    });
                });
            });
        };

        $scope.verifyNow = function() {
            if (!$scope.code) return;
            if (typeof($scope.code) != "string") return;

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
        //$scope.currentUser = auth.currentUser;
        $scope.currentUserId = auth.currentUserId;
        $scope.logOut = function() {
            if (!$scope.isLoggedIn()) return;
            else {
                auth.logOut();
                $state.reload(); // Reload state so logged out view doesn't contain user info
            }
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
                    {meta:'Relaxed: ', value:percent[0]},
                    {meta:'Happy: ', value:percent[1]},
                    {meta:'Could Be Better: ', value:percent[2]},
                    {meta:'Sad: ', value:percent[3]},
                    {meta:'Stressed: ', value:percent[4]},
                    {meta:'Angry: ', value:percent[5]}
                ]})
            }, 37500);

            // Redraw when sidebar is toggled
            var toggle = document.getElementById("toggleOn");
            toggle.addEventListener('click', function() {
                var percent = calculate_mood(auth.socialmood[0]);
                chart.update({series:[
                    {meta:'Relaxed: ', value:percent[0]},
                    {meta:'Happy: ', value:percent[1]},
                    {meta:'Could Be Better: ', value:percent[2]},
                    {meta:'Sad: ', value:percent[3]},
                    {meta:'Stressed: ', value:percent[4]},
                    {meta:'Angry: ', value:percent[5]}
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
        //$scope.currentUser = auth.currentUser;
        $scope.currentUserId = auth.currentUserId;

        $scope.currentSocialMood = auth.socialmood;
        $scope.currentMood = auth.usermood; // In case the usermoodinfo promise fails

        $scope.currentStatus = auth.status; // In case the userstatusinfo promise fails
        $scope.currentStatusSaved = auth.statusSaved; // In case the userstatusinfo promise fails
        $scope.copyStatus = '';

        $scope.selectRandomUser = auth.selectRandomUser;
        $scope.selectedMood = 'Please wait';
        $scope.selectedStatus = 'Please wait';
        $scope.selectedUserId = '';
        $scope.note = '';
        $scope.donemessage = '';
        $scope.showbox = false;

        // Check if current mood is equal to the parameter, to help decide which mood button to highlight
        $scope.checkMood = function(moodString) {
            if (!$scope.isLoggedIn()) return;
            else if (!$scope.currentMood) return;
            else if ($scope.currentMood.length === 0) {
                return false;
            }
            else if ("undefined" === typeof $scope.currentMood[0].mood) {
                return false;
            }
            else if ($scope.currentMood[0].mood == 'Select one below!') {
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
            if (!$scope.isLoggedIn()) return;
            // If same mood as current mood, don't do anything
            else if ($scope.currentMood[0].mood === moodString) {
                return;
            }
            else {
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
            }
         };

         // Flip status from saved to update
         $scope.flipStatus = function() {
            if (!$scope.isLoggedIn()) return;
            else {
                $scope.currentStatusSaved = false;
                $scope.copyStatus = angular.copy($scope.currentStatus);
                $scope.$applyAsync(); // Apply changes in view
            }
         };

          // Save status and flip back to saved mode
         $scope.saveStatus = function() {
            if (!$scope.isLoggedIn()) return;
            else if (typeof(this.copyStatus) != 'string') return;
            else {
                auth.setUserStatus($scope.currentUserId(), this.copyStatus).then(function() {
                    $scope.currentStatusSaved = true;
                    $scope.currentStatus = auth.status;
                    $scope.$applyAsync(); // Apply changes in view
                });
            }
         };

         // Select a random user who's feeling low, who's not the current user
         $scope.helpRandomUser = function() {
            $scope.selectedMood = 'Please wait';
            $scope.selectedStatus = 'Please wait';
            $scope.selectedUserId = '';
            $scope.note = '';
            $scope.donemessage = '';
            $scope.showbox = false;
            document.getElementById('helpsomeone').style.display = 'block';
            auth.selectRandomUser($scope.currentUserId()).then(function(data) {
                if (data[0].mood == 'NA' && data[0].status == 'NA') {
                    $scope.selectedMood = 'N/A';
                    $scope.selectedStatus = 'N/A';
                    $scope.selectedUserId = 'Dummy string';
                    $scope.donemessage = 'Everyone\'s feeling fine for now!';
                    $scope.showbox = false;
                    $scope.$applyAsync();
                }
                else {
                    $scope.selectedMood = data[0].mood;
                    if ($scope.selectedMood == 'couldbebetter') {
                        $scope.selectedMood = 'could be better';
                    }
                    if (data[0].status == '') {
                        $scope.selectedStatus = 'The user has not provided a status.';
                    }
                    else {
                        $scope.selectedStatus = data[0].status;
                    }
                    $scope.selectedUserId = data[0]._id;
                    $scope.showbox = true;
                    $scope.$applyAsync();
                }
            });
         };

         // Select a random user who's feeling low, who's not the current user and not the provided user
         $scope.helpAnotherUser = function(provideduserId) {
            $scope.selectedMood = 'Please wait';
            $scope.selectedStatus = 'Please wait';
            $scope.selectedUserId = '';
            $scope.note = '';
            $scope.donemessage = '';
            $scope.showbox = false;
            document.getElementById('helpsomeone').style.display = 'block';
            auth.selectAnotherUser($scope.currentUserId(), provideduserId).then(function(data) {
                if (data[0].mood == 'NA' && data[0].status == 'NA') {
                    $scope.selectedMood = 'N/A';
                    $scope.selectedStatus = 'N/A';
                    $scope.selectedUserId = 'Dummy string';
                    $scope.donemessage = 'Everyone else is feeling fine for now!';
                    $scope.showbox = false;
                    $scope.$applyAsync();
                }
                else {
                    $scope.selectedMood = data[0].mood;
                    if ($scope.selectedMood == 'couldbebetter') {
                        $scope.selectedMood = 'could be better';
                    }
                    if (data[0].status == '') {
                        $scope.selectedStatus = 'The user has not provided a status.';
                    }
                    else {
                        $scope.selectedStatus = data[0].status;
                    }
                    $scope.selectedUserId = data[0]._id;
                    $scope.showbox = true;
                    $scope.$applyAsync();
                }
            });
         };

         // Send note
         $scope.sendNote = function(recipientId) {
            if (!$scope.note || $scope.note === '') { return; }
            if (typeof($scope.note) != 'string') return;

            auth.createMessage({
                author: $scope.currentUserId(),
                recipient: recipientId,
                body: $scope.note,
                date: new Date()
            });
            document.getElementById('helpsomeone').style.display='none';
            document.getElementById('thankyou').style.display='block';
         };

         // Show user's whole status in a popup
         $scope.showStatus = function(status) {
            $scope.fullstat = status;
            if ($scope.fullstat == '') $scope.fullstat = 'Your status is currently empty.'
            document.getElementById('fullstatus').style.display = 'block';
         };

         // Show status explanation popup
         $scope.statusAbout = function() {
            document.getElementById('statusinfo').style.display = 'block';
         };
    }]);

// Notes inbox controller
app.controller('MsgCtrl', ['$scope', 'auth',
    function($scope, auth) {
        $scope.notes = auth.notes;
        $scope.notesEmpty = auth.notesEmpty;

        $scope.deleteMessage = function(selectedNote) {
            if (!auth.isLoggedIn()) return; 
            else {
                auth.deleteMessage(auth.currentUserId(), selectedNote);
            }
        };

        $scope.noteCheck = function(note) {
            if (!auth.isLoggedIn()) return;
            else {
                document.getElementById('notecheck').style.display = 'block';
                $scope.curNote = note;
            }
        };
    }]);

// Mood tracker controller
app.controller('TrackerCtrl', ['$scope', '$state', 'auth',
    function($scope, $state, auth) {
        $scope.moodata = {};
        $scope.availableOptions = [{id: '0', name: '1'}, {id: '1', name: '2'}, {id: '2', name: '3'},
            {id: '3', name: '4'}, {id: '4', name: '5'}, {id: '5', name: '6'}, {id: '6', name: '7'},
            {id: '7', name: '8'}, {id: '8', name: '9'}, {id: '9', name: '10'}];
        $scope.availableOptionsSpecial = [{id: '1', name: '2'}, {id: '2', name: '3'},
            {id: '3', name: '4'}, {id: '4', name: '5'}, {id: '5', name: '6'}, {id: '6', name: '7'},
            {id: '7', name: '8'}, {id: '8', name: '9'}];
        $scope.availableOptionsExercise = [{id: '1', name: '15'}, {id: '2', name: '30'},
            {id: '3', name: '45'}, {id: '4', name: '60'}, {id: '5', name: '75'}, {id: '6', name: '90'},
            {id: '7', name: '105'}, {id: '8', name: '120'}];

        $scope.currentUserId = auth.currentUserId;

        // Show tracker explanation popup
        $scope.trackerPopup = function() {
           document.getElementById('trackerinfo').style.display = 'block';
        };

        // Create a new mood data entry for this user, for today
        $scope.addMoodata = function() {
            if (!$scope.moodata.wellbeing || !$scope.moodata.sleep || !$scope.moodata.exercise || !$scope.moodata.study || !$scope.moodata.social) {
                return;
            }
            if (typeof($scope.moodata.wellbeing) != 'string' || typeof($scope.moodata.sleep) != 'string' ||
                typeof($scope.moodata.exercise) != 'string' || typeof($scope.moodata.study) != 'string' || typeof($scope.moodata.social) != 'string') {
                return;
            }

            var todayDate = new Date();
            var todayString = todayDate.getMonth() + "," + todayDate.getDate() + "," + todayDate.getFullYear();

            auth.createMoodata({
                entryuser: auth.currentUserId(),
                date: todayDate,
                today: todayString,
                wellbeing: $scope.moodata.wellbeing,
                sleep: $scope.moodata.sleep,
                exercise: $scope.moodata.exercise,
                study: $scope.moodata.study,
                social: $scope.moodata.social
            }).then(function() {
                console.log(todayString);
                $state.go('mymoodcharts', {id: auth.currentUserId()});
            });
        };
    }]);

// Mood charts controller
app.controller('ChartsCtrl', ['$scope', '$state', 'auth', 'moodataPromise',
    function($scope, $state, auth, moodataPromise) {
        $scope.currentUserId = auth.currentUserId;
        $scope.allmoodata = moodataPromise;
        $scope.oneweek = {
            wellbeingArray: $scope.allmoodata.wellbeingArray.slice(0, 7),
            sleepArray: $scope.allmoodata.sleepArray.slice(0, 7),
            exerciseArray: $scope.allmoodata.exerciseArray.slice(0, 7),
            studyArray: $scope.allmoodata.studyArray.slice(0, 7),
            socialArray: $scope.allmoodata.socialArray.slice(0, 7),
        };
        $scope.onemonth = {
            wellbeingArray: $scope.allmoodata.wellbeingArray.slice(0, 31),
            sleepArray: $scope.allmoodata.sleepArray.slice(0, 31),
            exerciseArray: $scope.allmoodata.exerciseArray.slice(0, 31),
            studyArray: $scope.allmoodata.studyArray.slice(0, 31),
            socialArray: $scope.allmoodata.socialArray.slice(0, 31),
        };
        // Currently, we're only allowing for up to 1 month
        // (At this point, charts would look empty and ugly if we allowed for more)
        // $scope.oneyear = {
        //     wellbeingArray: $scope.allmoodata.wellbeingArray.slice(0, 365),
        //     sleepArray: $scope.allmoodata.sleepArray.slice(0, 365),
        //     exerciseArray: $scope.allmoodata.exerciseArray.slice(0, 365),
        //     studyArray: $scope.allmoodata.studyArray.slice(0, 365),
        //     socialArray: $scope.allmoodata.socialArray.slice(0, 365),
        // };

        $scope.timeframe = 'week';
        $scope.active_week = 'w3-gray';
        $scope.active_month = 'w3-inactive';

        var data = get_moodchartdata($scope.oneweek, 7);
        var chart = create_moodchart(data);

        $scope.change_timeframe = function(timeframe) {
            if (timeframe === 'week') {
                $scope.timeframe == 'week';
                $scope.active_week = 'w3-gray';
                $scope.active_month = 'w3-inactive';
                document.getElementById("moodchart-legend").innerHTML = "";
                data = get_moodchartdata($scope.oneweek, 7);
                chart = create_moodchart(data);
            } else {
                $scope.timeframe = 'month';
                $scope.active_week = 'w3-inactive';
                $scope.active_month = 'w3-gray';
                document.getElementById("moodchart-legend").innerHTML = "";
                data = get_moodchartdata($scope.onemonth, 31);
                chart = create_moodchart(data);
            }
        }

        // Chart animation
        // var seq = 0,
        //     delays = 10,
        //     durations = 1000;

        // Once the chart is fully created we reset the sequence
        // chart.on('created', function() {
        //   seq = 0;
        // });

        // On each drawn element by Chartist we use the Chartist.Svg API to trigger SMIL animations
        // chart.on('draw', function(data) {
        //   seq++;
        //
        //   if(data.type === 'line') {
        //     // If the drawn element is a line we do a simple opacity fade in. This could also be achieved using CSS3 animations.
        //     data.element.animate({
        //       opacity: {
        //         // The delay when we like to start the animation
        //         begin: seq * delays + 1000,
        //         // Duration of the animation
        //         dur: durations,
        //         // The value where the animation should start
        //         from: 0,
        //         // The value where it should end
        //         to: 1
        //       }
        //     });
        //   } else if(data.type === 'label' && data.axis === 'x') {
        //     data.element.animate({
        //       y: {
        //         begin: seq * delays,
        //         dur: durations,
        //         from: data.y + 100,
        //         to: data.y,
        //         // We can specify an easing function from Chartist.Svg.Easing
        //         easing: 'easeOutQuart'
        //       }
        //     });
        //   } else if(data.type === 'label' && data.axis === 'y') {
        //     data.element.animate({
        //       x: {
        //         begin: seq * delays,
        //         dur: durations,
        //         from: data.x - 100,
        //         to: data.x,
        //         easing: 'easeOutQuart'
        //       }
        //     });
        //   } else if(data.type === 'point') {
        //     data.element.animate({
        //       x1: {
        //         begin: seq * delays,
        //         dur: durations,
        //         from: data.x - 10,
        //         to: data.x,
        //         easing: 'easeOutQuart'
        //       },
        //       x2: {
        //         begin: seq * delays,
        //         dur: durations,
        //         from: data.x - 10,
        //         to: data.x,
        //         easing: 'easeOutQuart'
        //       },
        //       opacity: {
        //         begin: seq * delays,
        //         dur: durations,
        //         from: 0,
        //         to: 1,
        //         easing: 'easeOutQuart'
        //       }
        //     });
        //   } else if(data.type === 'grid') {
        //     // Using data.axis we get x or y which we can use to construct our animation definition objects
        //     var pos1Animation = {
        //       begin: seq * delays,
        //       dur: durations,
        //       from: data[data.axis.units.pos + '1'] - 30,
        //       to: data[data.axis.units.pos + '1'],
        //       easing: 'easeOutQuart'
        //     };
        //
        //     var pos2Animation = {
        //       begin: seq * delays,
        //       dur: durations,
        //       from: data[data.axis.units.pos + '2'] - 100,
        //       to: data[data.axis.units.pos + '2'],
        //       easing: 'easeOutQuart'
        //     };
        //
        //     var animations = {};
        //     animations[data.axis.units.pos + '1'] = pos1Animation;
        //     animations[data.axis.units.pos + '2'] = pos2Animation;
        //     animations['opacity'] = {
        //       begin: seq * delays,
        //       dur: durations,
        //       from: 0,
        //       to: 1,
        //       easing: 'easeOutQuart'
        //     };
        //
        //     data.element.animate(animations);
        //   }
        // });
    }]);
