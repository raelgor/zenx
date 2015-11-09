// A custom directive to replace the `img` tag.
// The goal is to display an image with a prefered
// animation only after the image has fully loaded
zenx.app.directive('zImage', function(){
	
	return {
	
		link: function(scope, element, attrs){
			
			// Create an image object to store
			// the image so we can get a callback
			var image = new Image();
			
			image.src = attrs.src;
			image.onload = function(){
				
				// When loaded, display the image
				// and apply animation
				$(element)
				.removeClass('ghost')
				.addClass(attrs.zAnimation || 'pop');
				
			}
			
			// Immediately (synchronously) hide image
			// and set `background-image` property
			$(element)
			.addClass('ghost')
			.css('background-image', 'url(' + attrs.src + ')')
			.addClass(attrs.class);
			
		}
		
	}
	
});