module.exports = function(grunt) {
	grunt.initConfig({
		stylus: {
			compile: {
				options: {
					compress: false
				},
				files: {
					'css/style.css': 'css/style.styl',
					'css/public.css': 'css/public.styl'
				}
			}
		},
		jade: {
			compile: {
				options: {
					pretty: true
				},
				files: {
					'index.html':  'index.jade',
					'public.html': 'public.jade'
				}
			}
		},
		
		watch: {
			files: ['*.jade', 'css/*.styl'],
			tasks: ['stylus', 'jade']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-contrib-jade');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', ['jade', 'stylus']);
}
