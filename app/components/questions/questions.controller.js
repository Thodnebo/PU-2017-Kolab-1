kolabApp.controller('questionsCtrl', ['$scope', '$http', function ($scope, $http) {
    console.log("Hello World from questions-controller");

    var refresh = function () {
        $http.get('/kolab').then(function (response) {
                console.log("I got the data I requested, questions-controller");
                $scope.kolab = response.data;
                $scope.question = null;
            },
            function (error) {
                console.log("I got ERROR");
            });
    };

    refresh();

    $scope.sendQuestion = function () {
        if ($scope.question != null && $scope.question.text.trim().length){
        $http.post('/kolab', $scope.question).then(function (response) {
            console.log(response);
            refresh();

        }); } else {
            refresh();
        }


    };

}]);