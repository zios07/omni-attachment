(function(){

    angular.module('omniAttachment')
    .config(AttachmentConfig);

	AttachmentConfig.$inject = ["$translateProvider"];

	function AttachmentConfig($translateProvider){
		$translateProvider.useStaticFilesLoader({
			prefix: 'lang-',
		    suffix: '.json'
		});
		$translateProvider.registerAvailableLanguageKeys(['en', 'fr'], {
             'en*': 'en',
             'fr*': 'fr'
         })
		// $translateProvider.uniformLanguageTag('bcp47').determinePreferredLanguage();
		$translateProvider.fallbackLanguage('en');
		$translateProvider.useSanitizeValueStrategy('escape');

	}

})();