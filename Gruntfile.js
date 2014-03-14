module.exports = function(grunt) {
	grunt.initConfig({
		stylus: {
			compile: {
				options: {
					compress: false
				},
				files: {
					'css/style.css': 'css/style.styl'
				}
			}
		},
		jade: {
			compile: {
				options: {
					pretty: true
				},
				files: {
					'index.html': 'index.jade'
				}
			}
		},
		watch: {
			files: ['index.jade', 'css/style.styl'],
			tasks: ['stylus', 'jade']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-contrib-jade');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['jade', 'stylus']);
}