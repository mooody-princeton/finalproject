angular.module('mooody', ['ui.router'])

var app = angular.module('mooody', ['ui.router']);

// for ui.router
app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      resolve: {
          // ensures that all posts are queried from backend before state finishes loading
          postPromise: ['posts', function(posts) {
              return posts.getAll();
          }]
      }
    });

    $stateProvider
    .state('posts', {
      url: '/posts/{id}',
      templateUrl: '/posts.html',
      controller: 'PostsCtrl',
      resolve: {
          post: ['$stateParams', 'posts', function($stateParams, posts) {
              return posts.get($stateParams.id);
          }]
      }
    });

  $urlRouterProvider.otherwise('home');
}]);

// factory vs service vs provider
app.factory('posts', ['$http', function($http) {
    var o = {
        posts: []
    };
    o.getAll = function() {
        return $http.get('/posts').success(function(data) {
            angular.copy(data, o.posts);
        });
    };
    o.create = function(post) {
        return $http.post('/posts', post).success(function(data) {
            o.posts.push(data);
        });
    };
    o.upvote = function(post) {
        // PUT is idempotent (use for existing posts)
        return $http.put('/posts/' + post._id + '/upvote').success(function(data) {
                post.upvotes += 1;
            });
    };
    o.get = function(id) {
        return $http.get('/posts/' + id).then(function(res){
                return res.data;
            });
        };
    o.addComment = function(id, comment) {
        console.log('Adding comment in app.factory()');
        return $http.post('/posts/' + id + '/comments', comment);
    };
    o.upvoteComment = function(post, comment) {
        console.log('Upvoting comment in app.factory()');
        return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote')
            .success(function(data){
                comment.upvotes += 1;
                });
            };
    return o;
}]);

app.controller('MainCtrl', [
    '$scope',
    'posts',
    function($scope, posts) {
        $scope.test = 'Hello World!';
        // Remove below and use factory()
        // $scope.posts = [
        //     {title: 'post 1', upvotes:5},
        //     {title: 'post 2', upvotes:2},
        //     {title: 'post 3', upvotes:15},
        //     {title: 'post 4', upvotes:9},
        //     {title: 'post 5', upvotes:4}
        // ];
        $scope.posts = posts.posts;
        $scope.addPost = function() {
            if (!$scope.title || $scope.title === '') { return; }
            // $scope.posts.push({
            //     title: $scope.title,
            //     link: $scope.link,
            //     upvotes: 0,
            //     comments: [
            //         {author: 'Joe', body: 'Cool post!', upvotes: 0},
            //         {author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
            //     ]
            // });
            posts.create({
                title: $scope.title,
                link: $scope.link,
            });
            $scope.title = '';
            $scope.link = '';
        }
        $scope.incrementUpvotes = function(post) {
            // post.upvotes += 1;
            posts.upvote(post);
        }
    }]);

app.controller('PostsCtrl', [
    '$scope',
    //'$stateParams',
    'posts',
    'post',
    //function($scope, $stateParams, posts){
    function($scope, posts, post){
        //$scope.post = posts.posts[$stateParams.id];
        $scope.post = post;

        $scope.addComment = function() {
            console.log('Adding comment in app.controller()');
            if ($scope.body === '') { return; }
            posts.addComment(post._id, {
                body: $scope.body,
                author: 'user',
            }).success(function(comment) {
                $scope.post.comments.push(comment);
            });
          $scope.body = '';
        };
        $scope.incrementUpvotes = function(comment) {
            console.log('Incrementing upvote in app.controller()');
            posts.upvoteComment(post, comment);
        }
    }]);
