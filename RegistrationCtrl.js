module.controller('RegistrationCtrl', function($scope, Credentials, AccountTypes, Tops, AuthResource, SignedUser, $route, CitiesResource, TracksResource,
 CountriesResource, UsersResource, $sce, $interval, $timeout, Projects, $location, $filter, $http){

    $scope.account_types = AccountTypes;
    $scope.tops          = Tops;
    $scope.credentials   = Credentials;
    $scope.auth          = AuthResource;

    $scope.step = 1;
    if(SignedUser.user && SignedUser.user.name){
        $scope.signUped = true;
        $scope.user = SignedUser.user;
    }

    $scope.search_text   = '';

    $scope.states = {
        projectCreated: false,
        migrationCreated: false
    };

// Получение контента страницы
    $scope.content = null;
    var contentLabel = 'registration';
    $http({
        url: 'api/content/' + contentLabel, method: "GET"
    }).then(function(result) {
        if (result.data.content != 'undefined') {
            $scope.content = result.data.content;
        }
    });

    $scope.renderHtml = function( html){
        return $filter('wikitext')( html);
    };

    var timeout = [];
    $scope.changeSearchText = function(){
        if(timeout.length)
            angular.forEach(timeout, function(t, i){
                $timeout.cancel(t);
                timeout.splice(i, 1);
            });

        timeout.push($timeout(function(){
            $scope.users = UsersResource.querySearch({ login: $scope.search_text, limit: 10 });
        }, 200));
    };

    $scope.light = function(sin){
        return $sce.trustAsHtml(sin.replace(new RegExp($scope.search_text, "ig"), function(a){
            return "<span class='high'>"+a+" </span>";
        }));
    };

    $scope.check_email = function(email) {
        if (email && email.length > 0) {
            var promise = $scope.auth.check_email({email: email});
            promise.$promise.then(function(data) {
                $scope.credentials.email_checked = !!data.status;
                if ( !$scope.credentials.email_checked ){ 
                    if( data.user.deleted_at){
                        $scope.showRestoreUser = true;
                        $scope.userToRestore   = data.user;
                    } else {
                        $scope.showBusyEmail = true;
                    }
                } else {
                    $scope.showRestoreUser = false;
                    $scope.showBusyEmail = false;
                }
            });
        }
    };

    $scope.check_login = function(login) {
        if (login && login.length > 0) {
            var promise = $scope.auth.check_login({login: login});
            promise.$promise.then(function(data) {
                $scope.credentials.login_checked = !!data.status;
                if ( !$scope.credentials.login_checked ){
                    if( data.user.deleted_at){
                        $scope.showRestoreUser = true;
                        $scope.userToRestore   = data.user;
                    } else {
                        $scope.showBusyLogin = true;
                    }
                } else {
                    $scope.showRestoreUser = false;
                    $scope.showBusyLogin = false;
                }
            });
        }
    };

    $scope.restoreUser = function(){
        UsersResource.sendEmailCode({id: $scope.userToRestore.id, action: 'restore'}).$promise
            .then(function(){
                $scope.restoreCodeSent = true;
            });
    };

    $scope.link = function(){

    };


    $scope.check_password = function() {
        var password = $scope.credentials.password,
            password_repeat = $scope.credentials.password_repeat;
        if(password && password_repeat){
            if (password.length > 3 && password_repeat.length > 3) {
                var success = password == password_repeat;
                $scope.credentials.password_checked = success;
                return success;
            }
            else return false;
        }
    };

    $scope.current_step = function(step) {
        return ($scope.step == step) ? 'reg_step_a' : ''
    };

    $scope.to_step = function(step ) {
        var credentials = $scope.credentials;
        var data = {
            email: credentials.email,
            login: credentials.login,
            password: credentials.password,
            password_repeat: credentials.password_repeat,
            name: credentials.name,
            gender: credentials.gender,
            account_types: credentials.account_types,
            music_styles: credentials.music_styles
        };

        if (credentials.check_registration_data()) {
            var promise = $scope.auth.register(data);
            promise.$promise.then
            (function(user) {
                SignedUser.user = user;
                SignedUser.user.emailchecked = false;
                SignedUser.user.phonechecked = false;
                if(step == 2){
                    $location.search('fromRegister', true);
                    $location.path('/addproject');
                }
                else{
                    $location.path('/end_registration');
                }

                $scope.$emit('user:registered');
            }, function(data) {
                console.log('fail register');
                $route.reload();
            });
        }
    };

});