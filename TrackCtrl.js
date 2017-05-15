module.controller('TrackCtrl',
	['$scope', 'Track', 'jplayerInterface', '$window', 'headerState', 'FavouritesResource', 'LikesResource', 'TracksResource', 
    'promoTracks', 'SignedUser', 'accountVerifier', 'toaster', '$timeout', '$filter', 'AccountManager', 'ServicesResource', 'Projects',
		function ($scope, Track, jplayerInterface, $window, headerState, FavouritesResource, LikesResource, TracksResource, 
            promoTracks, SignedUser, accountVerifier, toaster, $timeout, $filter,  AccountManager, ServicesResource, Projects) {
			'use strict';

            $scope.user = SignedUser.user;
            $scope.AM = AccountManager;
            $scope.show_message = "Показать всех";

			$scope.track = Track;
			$scope.isBannerCodeShown = false;
			$scope.showBannerCode = function () {
				$scope.isBannerCodeShown = true;
			};
			$scope.player = jplayerInterface;
			$scope.playInfo = jplayerInterface.info;
            Projects.verifyPremium({id:$scope.track.project.id}).$promise
                .then(function(response){
                    $scope.tariff = response.id;
                });

            // define permissions  
            if( SignedUser.isSigned() ) {
                $scope.isModerator = SignedUser.isSuperModerator() || SignedUser.isAdmin();
                $scope.prs = $scope.AM.projects;

                var pr = _.find($scope.prs, function(p){ return p.id == $scope.track.project.id; });

                if(typeof pr !== "undefined"){
                    $scope.role = pr.role.length ? pr.role[0].name : null;
                } else {
                    $scope.role = '';
                }
                $scope.canDelete    =  $scope.role == 'project_admin' ||  $scope.isModerator;
                $scope.canEdit      =  $scope.canDelete  || $scope.role == 'project_moderator';
                $scope.isUploader   =  $scope.canEdit    || $scope.role == 'project_uploader';
                $scope.isEditor     =  $scope.canEdit    || $scope.role == 'project_editor';
                $scope.isPromoter   =  $scope.canEdit    || $scope.role == 'project_promoter';
            }

            if((!$scope.track.enabled || !$scope.track.published) && !($scope.isUploader || $scope.isPromoter)){
                $scope.enabled = false;
            } else {
                $scope.enabled = true;
            }

            if( $scope.AM.isProject ) {
                var pr_role = $scope.AM.project.role[0].name;

                if( pr_role == 'project_editor' || pr_role == 'project_promoter' ||
                    pr_role == 'project_admin'  || pr_role == 'project_moderator' || $scope.isModerator){
                    $scope.canComment = true;
                }
                    
            }

            $scope.textCutKey = true;
            if ($scope.track.descr == null){
                $scope.track.descr = '';
            }
            $scope.descr_lenght = $scope.track.descr.length;
            if($scope.track.public_date != null) {
            $scope.track.public_date = new Date($scope.track.public_date.slice(0,10));
            }

            //--в избранное
            $scope.FavouritesResource = FavouritesResource;

            ServicesResource.resource.query().$promise.then(function(services){

                angular.forEach(services, function(service) {
                    if (service.code_name == 'promoGlobal' && service.status == 'enabled') {$scope.isPromoGlobalEnabled = true}
                });

            });


            //если волна ещё не была сгенерирована, проверяем каждые пять секунд, пока она не появится:
            if (!$scope.track.wave_generated) {

                var max_tries = 30, //максимальное количество проверок волны
                    tries = 0,
                    wavePromise;

                var checkWave = function(){
                    TracksResource.getWave({id: $scope.track.id}).$promise
                        .then(function(response){
                            tries++;
                            if (!response.wave_generated && tries < max_tries) {
                                wavePromise = $timeout(checkWave, 5000);
                            } else {
                                $scope.track.wave_generated = response.wave_generated;
                                $scope.track.wave_url       = response.wave_url;
                            }
                        });
                };

                $scope.$on('$routeChangeStart', function(){
                    $timeout.cancel(wavePromise);
                });

                wavePromise = $timeout(checkWave, 5000);


            }

            //избранное

            //--лайки

            $scope.LikesResource = LikesResource;

            $scope.getLikes = function(type) {
                var type = type || 0;
                LikesResource.resource.getLikes({track_id: Track.id, type_id: type}).$promise.then(function(likes) {
                    $scope.userTypes = likes.userTypes;
                    $scope.likes     = likes.data;
                    $scope.userLikes = likes.users;
                });
            };

            $scope.$watch(function(){ return promoTracks.urPromo; }, function(v){
                $scope.urPromo = v;
            });

            $scope.likes_limit = 12;
            $scope.changeLimit = function() {
                if ($scope.likes_limit == 12)
                {
                    $scope.likes_limit = 30;
                    $scope.show_message = "Скрыть всех";
                    return true;
                }
                $scope.likes_limit = 12;
                $scope.show_message = "Показать всех";
                return true;
            };

            $scope.likesCount = function(type) {
                if (!$scope.userTypes || !$scope.userTypes[type]) {
                    return 0;
                }
                return $scope.userTypes[type].count;
            };

            $scope.tabLikes = function(type) {
                $scope.getLikes(type);
            };

            $scope.getLikes();

            $scope.like = function() {
                if ( !SignedUser.isSigned() ){
                    toaster.pop('warning', 'Зарегистрируйтесь или войдите, чтобы ставить лайки')
                    return;
                }
                 if(SignedUser.user.id == $scope.track.user_id){
					toaster.pop('error', "Нельзя лайкнуть свой трек");
					return;
				}
                if ( accountVerifier.userCan('like_create', 'email', true, 'Подтвердите Ваш e-mail, чтобы ставить лайки') ){
                    LikesResource.likeTrack($scope.track, $scope);
                }
            };
            
            $scope.favourite = function(track){
                if ( !SignedUser.isSigned() ){
                    toaster.pop('warning', 'Зарегистрируйтесь или войдите, чтобы добавлять в избранное')
                    return;
                }
                if(SignedUser.user.id == $scope.track.user_id){
                    	toaster.pop('error', "Нельзя добавить в избранное свой трек");
					return;
				}
                FavouritesResource.favouriteTrack(track);
            }
            
            $scope.delete = function(id){
                TracksResource.delete({'id': id}).$promise
                    .then(function(){
                        toaster.pop('success', 'Трек удалён');
                        window.location = "/#!/tracks";
                    });
            }
            
            $scope.share = function(){ 
                $('#sh'+$scope.track.id).slideToggle();
            }
            
            $scope.renderHtml = function(html, textCutKey){
                if(textCutKey) {
                      html = html.substr(0,800);
                }
                return $filter('wikitext')(html);
            };

            $scope.toggleHidden = function () {
                if ($scope.readOnly) {
                    return;
                }
                if ( !($scope.isUploader && $scope.tariff) ){
                    toaster.pop('error', "Премиальная услуга", "Купите Премиум тариф");
                    return;
                }

                $scope.track.enabled = !$scope.track.enabled;

                var _track = new TracksResource($scope.track);

                var def = _track.$save();
                def.then(function () {
                    toaster.pop('success', "Действие успешно выполнено", "Видимость трека успешно изменена");
                }, function () {
                    toaster.pop('error', "Произошла ошибка", "Не удалось изменить видимость трека");
                    $scope.track.enabled = !$scope.track.enabled;
                });
                return def;
            };
		}]
);