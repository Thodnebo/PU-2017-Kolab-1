kolabApp.controller('lecturerCtrl', ['$scope', '$http', function ($scope, $http) {
    console.log("Hello World from controller");

    var refresh = function () {
        $http.get('/kolab').then(function (response) {
                console.log("I got the data I requested");
                $scope.kolab = response.data;
                $scope.question = null;
            },
            function (error) {
                console.log("I got ERROR");
            });
    };

    refresh();

    $scope.studentView = function () {
        console.log("cantKeepUp button was clicked");
    };

    $scope.remove = function (id) {
        console.log(id);
        $http.delete('/kolab/' + id).then(function (response) {
            refresh();
        });
    };
}]);