'use strict';

module.exports = function(grunt) {

    grunt.registerMultiTask('concatTmpl', 'Concatenate tmpl files as script tags', function() {

        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            separator: grunt.util.linefeed,
            banner: ''
        });

        var banner = grunt.template.process(options.banner);

        // Iterate over all src-dest file pairs.
        this.files.forEach(function(f) {

            // Concat banner + specified files + footer.
            var src = banner + f.src.filter(function(filepath) {
                
                // Warn on and remove invalid source files (if nonull was set).
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }

            }).map(function(filepath) {

                // Read file source.
                var tmpl = grunt.file.read(filepath);
                    
                // extract the filename without extension
                var filename = filepath.split('/').pop().split('.').shift();

                // place the template in a script tag
                return '<script type="text/html" id="' + filename + '.tmpl">\n' +
                    tmpl + '\n</script>';

            }).join(grunt.util.normalizelf(options.separator));

            // Write the destination file.
            grunt.file.write(f.dest, src);

            // Print a success message.
            grunt.log.writeln('File "' + f.dest + '" created.');
        });
    });

};