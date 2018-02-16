(function(){

    angular.module('omniAttachment')
    .provider('OmniAttachmentService', OmniAttachmentServiceProvider);

    function OmniAttachmentServiceProvider(){    
        
        var baseUrl = env.defaultBaseUrl;
        var typesUrl = env.defaultTypesUrl;
        var criteriaConfigUrl = env.defaultCriteriaConfigUrl;

        var provider = {
            setBaseUrl : setBaseUrl,
            getBaseUrl : getBaseUrl,
            setCriteriaConfigUrl : setCriteriaConfigUrl,
            getCriteriaConfigUrl : getCriteriaConfigUrl,
            $get: omniAttachmentService
        }
        
        return provider;

        
        function setBaseUrl(url){
            baseUrl = url;
        }

        function getBaseUrl(){
            return baseUrl;
        }

        function setCriteriaConfigUrl(url){
            criteriaConfigUrl = url;
        }

        function getCriteriaConfigUrl(){
            return criteriaConfigUrl;
        }

        function omniAttachmentService($http, $window, toastr){
            
            var uuid = "";

            var service = {
                getURL: getURL,
                getConfig : getConfig,
                getEntity : getEntity,
                getCriteria : getCriteria,
                getCriteriaCategories: getCriteriaCategories,
                getTypes : getTypes,
                getAttachments : getAttachments,
                downloadAttachment : downloadAttachment,
                updateDelivered : updateDelivered,
                deleteAttachment : deleteAttachment,
                generateUUID: generateUUID,
                getUUID : getUUID,
                resetUUID : resetUUID,
                updateAttachableId : updateAttachableId
            }
            return service;

            //Get the url for upload method in the directive
            function getURL(){
                return baseUrl;
            }

            function getTypes(){
                return $http.get(typesUrl);
            }

            function getAttachments(attachableId, className, appName, criteria){
                return $http.get(baseUrl+"?attachableId="+attachableId+"&className="
                    +className+"&appName="+appName+"&criteria=");
            }

            function downloadAttachment(id){
                var auth_header = JSON.parse($window.sessionStorage.getItem('token'));
                if(angular.isDefined(auth_header) && auth_header != null){
                  var access_token = auth_header.access_token;
                  $window.open(baseUrl + '/' + id + "?access_token=" + access_token);
                } else {
                  $window.open(baseUrl + '/' + id);
                }
            }

            function updateDelivered(category){
                return $http.put(baseUrl+"/updateDelivered", category.attachment);
            }

            function deleteAttachment(id){
                return $http.delete(baseUrl + '/' + id);
            }

            // Getting the criteria config object
            function getConfig(){
                return $http.get(criteriaConfigUrl);
            }

            function getEntity(config, className){
                var entity = {};
                if(angular.isDefined(config)){
                    config.entities.forEach(function(e){
                        if (e.className == className)
                            entity = e;
                    })
                }
                return entity;
            }

            function getCriteria(config, className, criteria){
                var currCriteria = {};
                var currEntity = getEntity(config, className);
                if(angular.isDefined(currEntity.criterias))
                    currEntity.criterias.forEach(function(crit){
                        if(crit.codeCriteria == criteria)
                            currCriteria = crit;
                    })
                else
                    toastr.error("No criteria for : "+className);
                return currCriteria;
            }

            // Extracting configuration from config object
            function getCriteriaCategories(config, className, criteria){
                    
                var entity = {};
                var categories = [];
                
                // Getting the right entity object
                if(angular.isDefined(config))
                    config.entities.forEach(function(e){
                        if(e.className == className){
                            entity = e;
                            // Add isGlobal flag to the entity's categories
                            setGlobal(entity.categories);
                            // Add entity categories (global categories) to categories array
                            addCategories(categories, entity.categories);
                        }
                    })

                // Getting the right criteria from the entity
                if(angular.isDefined(entity.criterias))
                    entity.criterias.forEach(function(crit){
                        if(crit.codeCriteria == criteria)
                            // Add criteria categories to categories array
                            addCategories(categories, crit.categories);
                    })

                return categories;

            }

            // Add objects of src array to dest array
            function addCategories(dest, src){
                if(angular.isDefined(src) && src != null && src.length > 0){
                    angular.forEach(src, function(category){
                        dest.push(category);
                    })
                }
            }

            // Add isGlobal flag to each element of categories array
            function setGlobal(categories){
                if(angular.isDefined(categories) && categories != null && categories.length > 0){
                    angular.forEach(categories, function(category){
                        category.isGlobal = true;
                    })
                }
            }

            // Generate UUID only if it is defined and empty
            function generateUUID() {
                if(angular.isDefined(uuid) && uuid == ""){
                    var d = new Date().getTime();
                    if (window.performance && typeof window.performance.now === "function") {
                        d += performance.now(); //use high-precision timer if available
                    }
                    uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                        var r = (d + Math.random() * 16) % 16 | 0;
                        d = Math.floor(d / 16);
                        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                    })
                }
              }

            // Empty uuid to regenerate it
            function resetUUID(){
                uuid = "";
            }
    
            function getUUID(){
                return uuid;
            }

            function setUUID(id){
                uuid = id;
            }
    
            // Takes in the id of the persisted entity and update attachment's attachableId
            function updateAttachableId(id) {
                // var uuid = AttachmentService.getUUID();
                if (angular.isDefined(uuid) && uuid != "") {
                    var url = baseUrl + "?id=" + id + "&uuid=" + uuid;
                    $http.put(url).then(function(response){
                        resetUUID();
                    }, function(error){
                        toastr.error(error);
                    });
                }
            }

        }
        omniAttachmentService.$inject = ['$http', '$window', 'toastr'];
    }
    

})()