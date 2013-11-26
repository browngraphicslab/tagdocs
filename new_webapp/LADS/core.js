/**
 * core.js
 * Checks server connectivity, if working, creates new start page.
 * Dependencies: jQuery, Layout.StartPage, Layout.InternetFailurePage
 */

(function() {
	"use strict";
	
	function init() {
		console.log("IN INIT");
		LADS.Layout.StartPage(null, function(page) {
			$("body").append(page);
		});
	}
	
	function checkServerConnectivity() {
		console.log("about to check server connectivity");
		var req = $.ajax({
			url: localStorage.ip || "http://137.135.69.3:8080", // default to Azure
			dataType: "text",
			async: false,
			error: function(err) {
				$("body").append((new LADS.Layout.InternetFailurePage("Server Down")).getRoot());
				return false;
			}
		});
		return true;
	}

	$(document).ready(function(e) {
		init();
	})
})();