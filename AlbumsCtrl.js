module.controller('AlbumsCtrl',
    ['$scope', 'Albums', 'imageCrop', 'scrollPaging', function ($scope, Albums, imageCrop, scrollPaging) {
        'use strict';

        // Параметры пагинации

        $scope.pagesCount = 0;
        $scope.loadedPages = [];
        $scope.total = 0;
        $scope.perPage = 5;
        $scope.infiniteScrollDisabled = true;
        $scope.currentPage = scrollPaging.getStartPage();

        function getAlbums(reload, page){
            $scope.loading = true;
            Albums.resource.queryPage({
                page: page || $scope.page,
                pageSize: $scope.perPage,
                filtering: 'with_tracks',
                ordering: $scope.sortDirection + $scope.sortType
            }, function(response){
                if(angular.isArray(response.data) && response.data.length){
                    if(reload){
                        $scope.albums = response.data;
                        $scope.loadedPages = [];
                        $scope.currentPage = page || $scope.currentPage;
                    }
                    else{
                        $scope.albums = $scope.albums.concat(response.data);
                    }
                    $scope.loadedPages[response.current_page] = response.data.length ? response.data[0].id : null;
                    $scope.total = response.total;
                    $scope.pagesCount = response.last_page;
                    $scope.loading = false;
                    $scope.infiniteScrollDisabled = !$scope.total || (response.current_page == response.last_page);
                    if (page) {
                        scrollPaging.scrollTo('#album-' + response.data[0].id, true).then(function() {
                            $scope.currentPage = page;
                        });
                    }
                }
            });
            $scope.page = page ? (page+1) : ($scope.page+1);
        }

        $scope.showPage = function(toPage, $event) {
            if(typeof $event != 'undefined'){
                $event.preventDefault();
                $event.stopPropagation();
            }
            if (angular.element('#album-' + $scope.loadedPages[toPage]).length) {
                scrollPaging.scrollTo('#album-' + $scope.loadedPages[toPage], true).then(function() {
                    $scope.currentPage = toPage;
                });
                return;
            }

            getAlbums(1, toPage);

            return false;
        };

        var sortTypes = {
                name: 'name',
                date: 'date'
            },
            sortDirections = {
                asc: '',
                desc: '-'
            },
            sorting = {
                'name': sortDirections.desc,
                'date': sortDirections.desc
            };
        $scope.loading = false;
        $scope.imageCrop = imageCrop;
        $scope.dateTime = (new Date()).getTime();
        $scope.getSrc = function(str){
            return /avatar/.test(str) ? str + '?d=' + $scope.dateTime : str;
        };
        $scope.page =  scrollPaging.getStartPage();
        $scope.albums = [];
        $scope.sortTypes = sortTypes;
        $scope.sortType = sortTypes.date;
        $scope.sortDirection = sortDirections.desc;
        getAlbums();
        $scope.sort = function (type){
            $scope.sortType = type;
            sorting[type] = (sorting[type] == sortDirections.asc)
                ? sortDirections.desc : sortDirections.asc;
            $scope.sortDirection = sorting[type];
            getAlbums(true);
        };
        $scope.isAsc = function() {
            return $scope.sortDirection === sortDirections.asc;
        };
        $scope.loadPage = function(){
            if ($scope.loading) {
                return;
            }
            $scope.infiniteScrollDisabled = true;
            getAlbums();
        };

    }]
);