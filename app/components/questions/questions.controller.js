kolabApp.controller('questionsCtrl', ['$scope', '$http','socket', function ($scope, $http, socket) {
    console.log("Hello World from questions-controller");

    var socket = io();

    $scope.grouped = "groupedTrue";

    // initial retrieval of questions from the database
    var refresh = function () {
        $http.get('/roomsQuestionsCollection').then(function (response) {
                console.log("I got the data I requested, questions-controller");
                console.log("This is the pure response object:" + response.text);
                $scope.kolabDBScope = response.data; //kolabdbscope is deprecated if newtags works
                $scope.question = null;
                //Used to identify the different tags, aka nouns
                $scope.newTags = {};

                for (var i = 0; i < $scope.kolabDBScope.length; i++) {
                    if (!$scope.newTags[$scope.kolabDBScope[i].tag]) {
                        $scope.newTags[$scope.kolabDBScope[i].tag] = [];
                    }
                    $scope.newTags[$scope.kolabDBScope[i].tag].push($scope.kolabDBScope[i]);
                }
                console.log("These are the tags: ", $scope.newTags); //object with array of objects

            },
            function (error) {
                console.log("I got ERROR", error);
            });
    };
    refresh();


    // remove function bound to the delete buttons in lecture view
    $scope.sendQuestion = function () {
        if ($scope.question != null && $scope.question.text.trim().length) {
            socket.emit('question message', $('#textareaQ').val(), socket.currentRoom);
            $('#textareaQ').val('');
            return false;
        }
    };

    $scope.switchView = function () {
        if ($scope.grouped == "groupedTrue") {
            $scope.grouped = "groupedFalse";
        } else {
            $scope.grouped = "groupedTrue";
        }
    };

    //delete function from standard, ungrouped view
    socket.on('question delete', function (index, obj) {
        console.log("Trying to delete message (SOCKET) with ID: " + obj._id);

        for (var i = 0; i < $scope.newTags[obj.tag].length; i++){
            if ($scope.newTags[obj.tag][i]._id=== obj._id){
                $scope.newTags[obj.tag].splice(i,1);
            }
        }


        $scope.kolabDBScope.splice(index, 1);
        $scope.$apply();
    });

    //delete function from grouped view
    socket.on('question delete grouped', function (rowIndex, index, obj) {
        console.log("Grouped: Trying to delete message with ID: " + obj._id + ", and rowIndex: "+rowIndex+ ", and normal index: "+index);
        $scope.newTags[obj.tag].splice(index, 1);
        console.log("Current state of scope: "+ $scope.kolabDBScope);
        for (var i = 0; i < $scope.kolabDBScope.length; i++){
            console.log($scope.kolabDBScope[i]);
            if ($scope.kolabDBScope[i]._id == obj._id){
                $scope.kolabDBScope.splice(i, 1);
                $scope.$apply();
                break;
            }
        }
        $scope.$apply();
    });


    // socket message "question message" and the response to that message
    socket.on('question message', function (msg) {
        console.log(msg.tag);
        $scope.kolabDBScope.push(msg);
        $scope.$apply();
        //needs an if-statement for whether we're on grouped or non-grouped view
        var newcategory = true;
        for (var property in $scope.newTags) {
            if ($scope.newTags.hasOwnProperty(property)) {
                if (msg.tag === property) {
                    console.log("We tried inserting directly into the scope", property);
                    newcategory = false;
                    $scope.newTags[property].push(msg);
                    $scope.$apply();
                    break;
                }
            }
        }
        if (newcategory == true) { //if the tag cannot be found we insert it into the scope
            console.log("Category not found.");
            $scope.newTags[msg.tag] = [];
            $scope.newTags[msg.tag].push(msg);
            $scope.$apply();
        }


    });

}]);