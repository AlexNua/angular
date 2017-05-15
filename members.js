module.directive('members', function (Projects, AccountManager, SignedUser, imageCrop, $http, toaster, $location, Roles) {
    'use strict';
    return {
        restrict: 'E',
        scope: {
            project: '='
        },
        templateUrl: 'main/partials/sub/members.html',
        controller :function($scope){
            $scope.loading   = true;
            $scope.disable   = true;
            $scope.showZero  = false;
            $scope.showRoles = false;
            $scope.imageCrop = imageCrop;
            $scope.roles     = {};
            $scope.changingRoles = {};
            $scope.filters = {
                sortBy: 'role_id',
                sortDir: true,
                filterBy: 'members',
                page: 1
            };

            $scope.AM = AccountManager;

            // define permissions 
            if ( SignedUser.isSigned() ) {
            $scope.isAdmin = SignedUser.isAdmin();
            $scope.isModerator = SignedUser.isSuperModerator() || SignedUser.isAdmin();
               
            $scope.prs = $scope.AM.projects;

            var pr = _.find($scope.prs, function(p){ return p.id == $scope.project.id; });

            if(typeof pr !== "undefined"){
                $scope.role = pr.role.length ? pr.role[0].name : null;
                $scope.canDelete    =  $scope.role == 'project_admin' ||  $scope.isAdmin;
                $scope.canEdit      =  $scope.canDelete  || $scope.role == 'project_moderator' ||  $scope.isModerator;
                $scope.isUploader   =  $scope.canEdit    || $scope.role == 'project_uploader';
                $scope.isEditor     =  $scope.canEdit    || $scope.role == 'project_editor';
                $scope.isPromoter   =  $scope.canEdit    || $scope.role == 'project_promoter';
                }
            }

            Roles.resource.query({'is_project': 1}).$promise.then(function(roles){
                if (typeof roles == 'object') {
                    angular.forEach(roles, function(item) {
                        $scope.roles[item.id] = item;
                        if (item.name != 'project_admin') {
                            $scope.changingRoles[item.id] = item;
                        }
                    });
                }
            });
            var filters = angular.copy($scope.filters);
            filters.projectId = $scope.project.id;
            if ("candidates" in $location.search()) {
                $scope.filters.filterBy = 'candidates';
                filters.filter_by = 'members';
                Projects.getMembers(filters).$promise.then(function(response) {
                    $scope.total = response.total;
                });
            } else {
                filters.filter_by = 'candidates';
                Projects.getMembers(filters).$promise.then(function(response) {
                    $scope.totalCandidates = response.total;
                });
            }
           
            $scope.loadPage = function(reload){
                $scope.loading = true;

                if (reload){
                    $scope.page = 1
                }

                var filters = angular.copy($scope.filters);
                filters.ordering = (filters.sortDir? '+' : '-') + filters.sortBy;
                filters.page = $scope.page;
                filters.projectId = $scope.project.id;
                delete(filters.filterBy);
                filters.filter_by = $scope.filters.filterBy;

                Projects.getMembers(filters).$promise
                    .then(function(response) {
                        $scope.disable = response.current_page == response.last_page;
                        $scope.users = reload ? response.data :  $scope.users.concat(response.data);
                        if (filters.filter_by == 'candidates') {
                            $scope.totalCandidates = response.total;
                        } else {
                            $scope.total = response.total;
                        }
                        $scope.showZero = ($scope.total == 0);
                        $scope.page++;
                        $scope.loading = false;
                        $scope.creator = false;
                        // ставим создателя на первое место
                        $scope.users.sort(function(a, b) {
                            if (a.id == $scope.project.creatorId){
                                  return -1;
                            }
                        });
                    });
            };

            $scope.$watchCollection('filters', function(){
                $scope.loadPage(true);
            });

            $scope.rejectMember = function(user) {
                Projects.rejectMember({project_id: $scope.project.id, user_id: user.id}).$promise.then(function(result){
                    $scope.users.splice($scope.users.indexOf(user), 1);
                    toaster.pop('success', 'Успех', 'Участник исключен из Проекта');
                    if ($scope.filters.filterBy == 'members') {
                        $scope.total -= 1;
                    } else {
                        $scope.totalCandidates -= 1;
                    }
                });
            };

            $scope.approveMember = function(user) {
                Projects.queryMembership({id: $scope.project.id, user_id: user.id, is_approved: 1}).$promise.then(function(result){
                    $scope.users.splice($scope.users.indexOf(user), 1);
                    toaster.pop('success', 'Успех', 'Участник добавлен в Проект');
                    $scope.total += 1;
                    $scope.totalCandidates -= 1;
                });
            };

            $scope.changeRole = function(userId, roleId) {
                Projects.changeMemberRole({project_id: $scope.project.id, user_id: userId, role_id: roleId}).$promise.then(function(result){});
            };
        }
    };
});