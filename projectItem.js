module.directive('projectItem', function (ProjectSubscribersResource, SignedUser, imageCrop, Projects, toaster) {
    'use strict';
    return {
        restrict: 'E',
        scope: {
            project: '=',
            owner: '=',
            ownerName: '=',
            reload: '='
        },
        templateUrl: 'main/partials/sub/project_item.html',
        controller: function ($scope) {
            var TYPE_PRO_DJ = 2;
            $scope.type = '';
            if($scope.project.type_id == TYPE_PRO_DJ){
                if($scope.project.has_mixes){
                    $scope.type = '?type=mix';
                } else if($scope.project.has_lives){
                    $scope.type = '?type=live';
                } else if($scope.project.has_shows){
                    $scope.type = '?type=radioshow';
                }
            }
            $scope.memberLimit = 3;
            $scope.myRole = $scope.project.role.length ? $scope.project.role[0].name : null;
            $scope.myRoleApproved = $scope.project.role.length ? $scope.project.role[0].is_approved : null;
            $scope.subscribe = function ($project, fn) {
                ProjectSubscribersResource.subscribe($project).$promise
                    .then(function (project) {
                        $project.subscribe = project.subscribe;
                        ProjectSubscribersResource.update_user(project);
                        if (fn) {
                            fn(this, arguments);
                        }
                    });
            };

            $scope.subscribeAndReload = function (project, fn) {
                $scope.subscribe(project, function () {
                    if (fn) {
                        fn(true);
                    }
                });
            };

            $scope.signed = SignedUser.isSigned();

            $scope.imageCrop = imageCrop;

            $scope.tryEnter = function () {
                $scope.showEnterConfirm = true;
            };

            $scope.confirmEnter = function (isConfirm) {
                $scope.showEnterConfirm = false;
                if (isConfirm) {
                    $scope.myRole = true;
                    Projects.queryMembership({id: $scope.project.id}).$promise.then(function(){
                        toaster.pop('success', 'Успех', 'Поздравляем. Вы отправили заявку на участие в Проекте.');
                    });
                }
            };

            $scope.escape = function () {
                Projects.rejectMember({project_id: $scope.project.id}).$promise.then(function(){
                    toaster.pop('success', 'Успех', 'Вы покинули Проект.');
                    $scope.myRole = null;
                });
            };

            $scope.restore = function(id){
                Projects.sendEmailCode({id: id, action:'restore'}).$promise
                    .then(function(){
                        toaster.pop('warning', 'На Ваш e-mail было выслано письмо с подтверждением восстановления Проекта', null, 3000);
                    });
            }
        }
    };
});