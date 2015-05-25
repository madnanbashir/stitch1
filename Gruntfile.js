//
// Gruntfile
//

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        bower: {
            install: {
                options: {
                    install: true,
                    cleanTargetDir: true,
                    verbose: true,
                    targetDir: 'media/js/vendor',
                    layout: 'byComponent',
                }
            }
        },
        mince: {
            js: {
                options: {
                    include: ['media/js'],
                    enable: ['source_maps'],
                    sourceMappingBaseURL: '/'
                },
                files: [{
                    src: '*.js',
                    dest: 'media/dist/',
                    expand: true,
                    cwd: 'media/js'
                }]
            },
            less: {
                options: {
                    include: ['media/less'],
                    enable: ['source_maps'],
                    sourceMappingBaseURL: '/'
                },
                files: [{
                    src: '*.less',
                    dest: 'media/dist/',
                    expand: true,
                    cwd: 'media/less',
                    ext: '.css'
                }]
            }
        },
        watch: {
            js: {
                files: './media/js/**/*',
                tasks: ['mince:js'],
                options: {
                    livereload: true
                }
            },
            less: {
                files: './media/less/**/*',
                tasks: ['mince:less'],
                options: {
                    livereload: true
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-mincer');
    grunt.loadNpmTasks('grunt-contrib-watch');
};
