--- /Users/jchou/Box Sync/333/finalproject/mooody/public/javascripts/new.js	Mon Apr 10 03:40:18 2017
+++ /Users/jchou/Box Sync/333/finalproject/mooody/public/javascripts/orig.js	Mon Apr 10 03:40:13 2017
@@ -183,11 +183,11 @@
             o.posts.push(data);
         });
     };
-    o.upvote = function(userid, post) {
-        return $http.put('/posts/' + post._id + '/upvote', {usr: userid}, {
+    o.upvote = function(post) {
+        return $http.put('/posts/' + post._id + '/upvote', null, {
             headers: { Authorization: 'Bearer ' + auth.getToken()}
         }).success(function(data) {
-            post.upvotes = data.userUpvotes.length;
+            post.upvotes += 1;
             });
     };
     o.downvote = function(post) {
@@ -274,7 +274,7 @@
 
         // Upvote post
         $scope.incrementUpvotes = function(post) {
-            posts.upvote(auth.currentUserId(), post);
+            posts.upvote(post);
         };
 
         // Flag post




index.js:
  req.post.upvote(req.body.usr, function(err, post){ 