(function(){

  angular.module('omniAttachment')
    .directive('omniAttachment', directive);

  directive.$inject = ["OmniAttachmentService","$timeout", "$http", "$uibModal", "$q", "toastr", "Upload", "$translate"];

  function directive(OmniAttachmentService,$timeout, $http, $uibModal, $q, toastr, Upload, $translate){
    var provider = {
      restrict: 'E',
      template: [
        '<table class="table table-bordered table-hover attachment-container" cell-padding="10">',
        '<thead class="attachment-container-head">',
        '<tr>',
        '<th ng-show="categories.length != 0" class="attachment-container-header" scope="col" translate="attachment.column.category"></th>',
        '<th ng-show="categories.length != 0" class="attachment-container-header" scope="col" translate="attachment.column.description"></th>',
        '<th ng-show="categories.length != 0" class="attachment-container-header" scope="col" translate="attachment.column.required"></th>',
        '<th ng-show="categories.length != 0" class="attachment-container-header" scope="col" translate="attachment.column.delivered"></th>',
        '<th class="attachment-container-header" scope="col" translate="attachment.column.attachment"></th>',
        '</tr>',
        '</thead>',
        '<tbody>',

        '<tr class="attachment-category" ng-repeat="cat in categories">',
        '<td class="attachment-container-col">{{cat.labelCategory}}</td>',
        '<td class="attachment-container-col">{{cat.attachment.description}}</td>',
        '<td class="attachment-container-col"><input disabled type="checkbox" ng-checked="cat.mandatory" /></td>',
        '<td class="attachment-container-col"><input ng-disabled="mode == \'read\'" type="checkbox" ng-model="cat.attachment.delivered" ng-change="onDeliveredChange(cat)" /></td>',
        '<td class="attachment-container-col" ng-show="mode == \'write\'">',

        '<div ng-show="!cat.file && !cat.attachment.uploaded">',
        '<div ngf-drop ngf-select ng-model="cat.file" class="drop-box" ngf-drag-over-class="\'dragover\'" ngf-allow-dir="true" accept="*">',

        '<span translate="attachment.misc.draganddrop"></span>',

        '</div>',

        '<div ngf-no-file-drop>File Drag/Drop is not supported for this browser</div>',
        '</div>',

        '<div ng-show="cat.file && !cat.uploading">{{cat.file.name}}<br>',
        '<button class="btn btn-default btn-sm attachment-upload-button" type="button" ng-click="uploadAttachment(cat, false, cat.displayPopup)">',
        '<span class="glyphicon glyphicon-cloud-upload"></span>{{"attachment.button.upload" | translate}}</button>',
        '<button class="btn btn-default btn-sm" ng-click="cancelUpload(cat)">',
        '<span class="glyphicon glyphicon-remove"></span>{{"attachment.button.cancel" | translate}}</button>',
        '</div>',

        '<div class="progress-container" ng-show="cat.uploading">',
        '<div class="progress-bar progress-bar-striped active attachment-progressbar" role="progressbar" aria-valuenow="{{progressPercentage}}" aria-valuemin="0" aria-valuemax="100" ng-style="{width: (progressPercentage+\'%\')}">{{progressPercentage}}%</div>',
        '</div>',

        '<div ng-show="cat.attachment.uploaded">',
        '<a ng-click="downloadAttachment(cat.attachment.id)"><span class="glyphicon glyphicon-download attachment-action-icons"></span></a>&nbsp;',
        '<a ng-click="deleteAttachment(cat.attachment.id, true)" ng-show="mode == \'write\'"><span class="glyphicon glyphicon-remove attachment-action-icons"></span></a>',
        '</div>',
        '</td>',
        '<td class="attachment-container-col" ng-show="mode == \'read\'">',
        '<a ng-show="cat.attachment" ng-click="downloadAttachment(cat.attachment.id)">',
        '<span class="glyphicon glyphicon-download attachment-action-icons"></span>',
        '</a>',
        '<div ng-show="!cat.attachment">',
        '<span translate="attachment.message.nodata"></span>',
        '</div>',
        '</td>',
        '</tr>',

        '<tr class="attachment-category attachment-free-upload" ng-show="mode == \'write\' && (entity.freeUpload.enabled || criteriaObj.freeUpload.enabled)">',
        '<td colspan="5" class="attachment-container-col">',
        '<div ngf-drop ngf-select ng-model="freeUploadCategory.file" class="free-drop-box" ngf-drag-over-class="\'dragover\'" ngf-allow-dir="true" accept="*">',

        '<span ng-show="!freeUploadCategory.file" translate="attachment.misc.draganddrop"></span>',
        '<span ng-show="freeUploadCategory.file"> {{freeUploadCategory.file.name}} </span>',

        '</div>',

        '<div ng-show="freeUploadCategory.file">{{cat.file.name}}<br>',
        '<button class="btn btn-default btn-sm attachment-upload-button" type="button" ng-click="uploadAttachment(freeUploadCategory , true, displayPopup)">',
        '<span class="glyphicon glyphicon-cloud-upload"></span>{{"attachment.button.upload" | translate}}</button>',
        '<button class="btn btn-default btn-sm" ng-click="cancelUpload(freeUploadCategory)"><span class="glyphicon glyphicon-remove"></span>{{"attachment.button.cancel" | translate}}</button>',
        '</div>',

        '<div class="progress-container" ng-show="freeUploadCategory.uploading">',
        '<div class="progress-bar progress-bar-striped active attachment-progressbar" role="progressbar" aria-valuenow="{{progressPercentage}}" aria-valuemin="0" aria-valuemax="100" ng-style="{width: (progressPercentage+\'%\')}">{{progressPercentage}}% </div>',
        '</div>',
        '</td>',
        '</tr>',

        '<tr class="attachment-category attachment-uncategorized" ng-show="uncategorizedAttachments.length != 0">',
        '<td colspan="5">',
        '<table align="center" cell-padding="5">',
        '<tr ng-repeat="attachment in uncategorizedAttachments" class="attachment-uncategorized-item">',
        '<td class="attachment-uncategorized-item-description">',
        '<span>{{attachment.description}}</span>',
        '</td>',
        '<td><hr></td>',
        '<td>',
        '<div class="attachment-uncategorized-item-glyphicons">',
        '<a ng-click="downloadAttachment(attachment.id)"><span class="glyphicon glyphicon-download attachment-action-icons"></span></a>&nbsp;',
        '<a ng-click="deleteAttachment(attachment.id, true)" ng-show="mode == \'write\'"><span class="glyphicon glyphicon-remove attachment-action-icons"></span></a>',
        '</div>',
        '</td>',
        '</tr>',
        '</table>',
        '</td>',
        '</tr>',


        ' </tbody>',
        '</table>'
      ].join('\n'),
      scope: {
        attachableId: "=",
        className: "=",
        applicationName: "=",
        criteria: "=",
        mode: "="
      },

      link: function(scope, element, attrs){

        scope.getConfig = getConfig;
        scope.getCriteriaCategories = getCriteriaCategories;
        scope.getEntity = scope.getEntity;
        scope.uploadAttachment = uploadAttachment;
        scope.cancelUpload = cancelUpload;
        scope.getAttachments = getAttachments;
        scope.downloadAttachment = downloadAttachment;
        scope.deleteAttachment = deleteAttachment;
        scope.onDeliveredChange = onDeliveredChange;

        scope.categories = [];
        scope.attachments = [];
        scope.uncategorizedAttachments = [];
        scope.config = {};
        scope.displayPopup = false;
        scope.progressPercentage = 0;
        // Delivered is true for free uploads
        scope.freeUploadCategory = {
          attachment : {
            delivered : true
          }
        }

        var URL = OmniAttachmentService.getURL();
        var MAX_SIZE = 16;
        var promises = [];
        var mainPromise = {};


        init();

        function init(){
          scope.uncategorizedAttachments = [];
          getConfig();
          mainPromise.then(function(){
            getEntity();
            getCriteria();
            getCriteriaCategories();
            getAttachments();
            $q.all(promises).then(function () {
              assignAttachmentsToCategories();
            })
          }, function(error){
            displayErrorMessage(error);
          })
        };

        function getConfig(){
          mainPromise = OmniAttachmentService.getConfig().then(function(response){
            scope.config = response.data;
          });
        };

        function getEntity(){
          scope.entity = OmniAttachmentService.getEntity(scope.config, scope.className);
          if (angular.isDefined(scope.entity.freeUpload) && scope.entity.freeUpload != null && scope.entity.freeUpload.enabled){
            scope.displayPopup = scope.entity.freeUpload.displayPopup;
          }
        };

        function getCriteria(){
          scope.criteriaObj = OmniAttachmentService.getCriteria(scope.config, scope.className, scope.criteria);
          if (angular.isDefined(scope.criteriaObj.freeUpload) && scope.criteriaObj.freeUpload !== null && scope.criteriaObj.freeUpload.enabled){
            if (!scope.displayPopup){
              scope.displayPopup = scope.criteriaObj.freeUpload.displayPopup;
            }
          }
        };

        function getCriteriaCategories(){
          scope.categories = OmniAttachmentService.getCriteriaCategories(scope.config, scope.className, scope.criteria);
        };

        function getAttachments(){
          var promise = OmniAttachmentService.getAttachments(scope.attachableId, scope.className, scope.applicationName)
            .then(function(response){
              scope.attachments = response.data;

            }, function(error){
              displayErrorMessage(error);
            });
          promises.push(promise);
        };

        function downloadAttachment(id){
          OmniAttachmentService.downloadAttachment(id);
        };

        var deleteModalHtml = [
          '<div class="modal-body" style="font-size: large">',
          '<p translate>attachment.message.delete</p>',
          '</div>',
          '<div class="modal-footer attachment-delete-modal">',
          '<button class="btn btn-primary" ng-click="delete()" translate>attachment.button.delete</button>',
          '<button class="btn btn-defualt" ng-click="cancel()" translate>attachment.button.cancel</button>',
          '</div>'
        ].join('\n');


        // attr showPopup : If checking or unchecking delivered, no need to show popup
        function deleteAttachment(id, showPopup){
          if(showPopup){
            $uibModal.open({
              template: deleteModalHtml,
              size: 'sm',
              controller: function($scope, $uibModalInstance) {
                $scope.name = 'top';
                $scope.delete = function(){
                  doDeleteAttachment(id);
                  $uibModalInstance.close();
                  displayTranslatedSuccessMessage("attachment.message.deleted");
                }
                $scope.cancel = function(){
                  $uibModalInstance.close();
                };
              }
            });
          }else{
            doDeleteAttachment(id);
          }
        }

        function doDeleteAttachment(id){
          OmniAttachmentService.deleteAttachment(id).then(function(response){
            init();
          })
        };

        function uploadAttachment(category, isFreeUpload, displayPopup){

          scope.uploadCategory = category;
          OmniAttachmentService.generateUUID();
          scope.uuid = OmniAttachmentService.getUUID();

          if(displayPopup){

            showUploadDialog();
            scope.$on('startUpload', function (event, details) {
              // remove listener
              scope.$$listeners.startUpload.splice(1);
              doUploadAttachment(details);
            })
          } else {
            doUploadAttachment();
          }
        };

        function cancelUpload(cat){
          cat.file = null;
        };

        // Upload attachment (details comming from popup if any)
        function doUploadAttachment(details){

          var category;

          var isCategoryDefined = false;
          var isFileDefined = false;
          var isCategoryAttachmentDefined = false;

          if(angular.isDefined(scope.uploadCategory) && scope.uploadCategory != null){
            isCategoryDefined = true;
            if(angular.isDefined(scope.uploadCategory.file) && scope.uploadCategory.file != null)
              isFileDefined = true;
            if(angular.isDefined(scope.uploadCategory.attachment) && scope.uploadCategory.attachment != null)
              isCategoryAttachmentDefined = true;
          }

          // Setting the attachmentDto category only if it contains code and label
          // Otherwise, it's a freeUpload without category
          if(isCategoryDefined)
            if(angular.isDefined(scope.uploadCategory.codeCategory) && angular.isDefined(scope.uploadCategory.labelCategory))
              category = scope.uploadCategory;


          // If no attachableId is set, use uuid
          if(!angular.isDefined(scope.attachableId) || scope.attachableId == null || scope.attachableId < 0)
            scope.attachableId = scope.uuid;

          // Filling the dto
          var attachmentDto = {
            attachableId: scope.attachableId,
            className : scope.className,
            appName : scope.applicationName,
            criteria: scope.criteria,
            category: category,
            delivered: false
          }

          if(isCategoryDefined){
            if(isCategoryAttachmentDefined && scope.uploadCategory.attachment.delivered){
              attachmentDto.id = scope.uploadCategory.attachment.id;
              attachmentDto.delivered = scope.uploadCategory.attachment.delivered;
            }
            // Abort download if size is too large
            if(isFileDefined){
              if(!angular.isDefined(scope.uploadCategory.maxSize) || scope.uploadCategory.maxSize == null){
                scope.uploadCategory.maxSize = MAX_SIZE;
              }
              if (scope.uploadCategory.file.size * Math.pow(10, -6) >= scope.uploadCategory.maxSize) {
                displayTranslatedErrorMessage("attachment.error.size", {max_size: scope.uploadCategory.maxSize});
                return;
              } else {
                attachmentDto.uploaded = true;
                // Setting description from data comming from popup if displaypopup = true
                // Otherwise the description is the fileName
                if(angular.isDefined(details))
                  attachmentDto.description = details.description;
                else
                  attachmentDto.description = extractFileName(scope.uploadCategory.file);
              }
            }
          }

          // Build and send the post query
          if(isCategoryDefined)
            scope.file = scope.uploadCategory.file;

          var upload = Upload.upload({
            url: URL,
            fields: {attachment: Upload.jsonBlob(attachmentDto)},
            file: scope.file,
          })

          upload.progress(function (evt) {
            // If uploading a file, show progress bar
            if(isFileDefined){
              scope.uploadCategory.uploading = true;
              scope.progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            }

          }).then(function (response) {
            onUploadSuccess(isFileDefined);
          }, function(error){
            displayErrorMessage(error);
          })
        };

        function onUploadSuccess(isFileDefined){
          $timeout(function(){
            init();
            scope.uploadCategory.uploading = false;
            if(isFileDefined){
              scope.uploadCategory.file = null;
              // displayTranslatedSuccessMessage("attachment.message.uploaded");
              toastr.success('attachment uploaded');
            }
          }, 2000)
        };

        // Event listener for checking/unchecking delivered checkbox
        function onDeliveredChange(cat){

          if(cat.attachment.delivered){
            if(!cat.attachment.uploaded){
              uploadAttachment(cat, false, false);
            }
            else
              updateDelivered(cat);
          } else {
            if(!cat.attachment.uploaded)
              deleteAttachment(cat.attachment.id, false);
            else
              updateDelivered(cat);
          }
        };

        function updateDelivered(cat){
          OmniAttachmentService.updateDelivered(cat).then(function(response){

          }, function(error){
            displayErrorMessage(error);
          })
        };

        // Adding attachment to category to show in table (using category code !)
        function assignAttachmentsToCategories(){

          angular.forEach(scope.categories, function(category){
            angular.forEach(scope.attachments, function(attachment){
              if(angular.isDefined(attachment.category) && attachment.category != null){
                if(attachment.category.codeCategory == category.codeCategory && attachment.criteria == scope.criteria){
                  category.attachment = attachment;
                }
              }
            })
          })

          angular.forEach(scope.attachments, function(attachment){
            if(!angular.isDefined(attachment.category) || attachment.category == null)
              scope.uncategorizedAttachments.push(attachment);
          })
        };

        // Watchers

        scope.$watch('criteria', function(newValue, oldValue) {
          if (newValue){
            if(oldValue != newValue)
              init();
          }
        }, true);

        scope.$watch('className', function(newValue, oldValue) {
          if (newValue){
            if(oldValue != newValue)
              init();
          }
        }, true);

        scope.$watch('attachableId', function(newValue, oldValue) {
          if (newValue){
            if(oldValue != newValue)
              init();
          }
        }, true);


        // Utils
        scope.truncate = function (num, places) {
          return Math.trunc(num * Math.pow(10, places)) / Math.pow(10, places);
        };

        scope.formatSize = function (attachments) {
          attachments.forEach(function (attachment, index) {
            if (attachment.size > 900 && attachment.size < 900000)
              attachment.size = scope.truncate((attachment.size / 1024), 2) + " Ko";
            else if (attachment.size > 900000)
              attachment.size = scope.truncate(((attachment.size) / 1000000), 2) + " Mb";
            else
              attachment.size = scope.truncate((attachment.size), 2) + " Octets";
          })
        };

        function extractFileName(file){
          var fileName = file.name;
          if(fileName.indexOf(".")){
            var n = fileName.lastIndexOf(".");
            fileName = fileName.substring(0, n);
          }
          return fileName;
        };

        function displayErrorMessage(error){
          var msg;
          switch(error.status){
            case 401:
              msg = "Unauthorized"
              break;
            case 404:
              msg = "Not found"
              break;
            default:
              msg = "Unknown error"
          }
          toastr.error(msg);
        };

        function displayTranslatedSuccessMessage(msg, params){
          $translate(msg, params).then(function(translatedMessage){
            toastr.success(translatedMessage);
          })
        };

        function displayTranslatedErrorMessage(msg, params){
          $translate(msg, params).then(function(translatedMessage){
            toastr.error(translatedMessage);
          })
        }
      }

    };


    var ModalInstanceCtrl2 = function ($scope, $uibModalInstance, $rootScope, $http) {
      $scope.attachmentDetails = {};

      $scope.ok = function () {
        if (angular.isDefined($scope.attachmentDetails.description) && $scope.attachmentDetails.description != null && $scope.attachmentDetails.description != "") {
          $rootScope.$broadcast('startUpload', $scope.attachmentDetails);
          $uibModalInstance.close();
        } else {
          $translate('attachment.error.nodescription')
            .then(function (translatedMessage) {
              toastr.error(translatedMessage);
            });
        }
      };

      $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
      };
    };


    function showUploadDialog() {
      var message = "attachment.message.upload";

      var modalHtml = '<div class="modal-header" style="font-size: large"><h3 translate>' + message + '</h3></div>';
      modalHtml += '<div class="modal-body attachment-upload-modal" style="font-size: large">';
      modalHtml += '<span translate="attachment.label.description"></span><span style="color: red" ng-hide="attachmentDetails.description">*</span><br><input type="text" ng-model="attachmentDetails.description" class="form-control" placeholder="{{\'attachment.placeholder.description\' | translate}}" /><br>';
      modalHtml += '<div class="modal-footer" style="width=20px; padding-top: 0; padding-bottom: 5px"><button class="btn btn-primary" ng-click="ok()" translate>attachment.button.upload</button><button class="btn btn-defualt" ng-click="cancel()" translate>attachment.button.cancel</button></div>';
      var modalInstance = $uibModal.open({
        template: modalHtml,
        controller: ModalInstanceCtrl2
      });
    };
    return provider;
  };

})()
