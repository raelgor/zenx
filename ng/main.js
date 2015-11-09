/* global zenx */
/* global FB */
/* global _zenx_data */

// The ZenX Client Framework
// In this object we will store all core methods
// and data
window['zenx'] = { 
	
	// Used for dev
	debug: 3,
	
	// Our angular app object
	app: angular.module('zenx',['ngAnimate','ngMaterial']),
	
	// Manage login frame
	loginFrame: {
		show: function(){
			
			$('.login-frame').removeClass('unborn');
			
			if(!this.isTouch) setTimeout(function(){
				
				$('.login-frame [name="username"]').focus();
				
			}, 400);
			
		},
		hide: function(){
			$('.login-frame').addClass('unborn');
		}
	},
	
	// UI functions
	ui: {
		
		// Shake an element like Apple's
		// wrong password nod
		shake: function(element){
			
			element = $(element);
			element.removeClass('shake');
			
			setTimeout(function(){
				element.addClass('shake');
			}, 100);
			
		}
		
	},
	
	// Core api calls
	api: {
		
		login: function(credentials){
			zenx.ui.shake('.login-frame .login-cred-wrapper')
		}
		
	},
	
	// Core send method
	send: function(obj) {
		
		return $.post('/api', obj);
		
	},
	
	// Detect touch device
	get isTouch() { return 'ontouchstart' in window; }

}

// Show fb buttons when FB lib loads
window.fbAsyncInit = function(){
	
	// Init the lib
	FB.init({
      appId      : '957277001026643', 
      xfbml      : true,
      version    : 'v2.5'
    });
	
	// Pop button
	$('.fb-login-btn').removeClass('unborn')
				      .addClass('pop');
	
}

// On DOM ready
$(window).ready(function(){
	
	// If not logged in, display login frame
	!_zenx_data.user && zenx.loginFrame.show();
	
	// Login form submit handler
	$('.login-frame form').submit(function(event){
		
		zenx.send({
			api: 'core',
			request: 'login',
			auth: $('.login-frame [name="username"]').val(),
			password: String(CryptoJS.MD5($('.login-frame [name="password"]').val()))
		}).success(function(response){
			
			response = JSON.parse(response);
			
			if(response.error)	
				return zenx.ui.shake('.login-frame .login-cred-wrapper');
			
		});
		
	});
	
});