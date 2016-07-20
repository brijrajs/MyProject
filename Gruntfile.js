/*!
* UltraCart - Mr Teas Template - http://www.ultracart.com/
*
 * Copyright (c) 2015 BPS Info Solutions Inc.
* License located here:
* http://www.ultracart.com/storefront/license/
*
* Designed by Level 2 Design, LLC http://www.level2d.com/
*/

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			src: [
				'Gruntfile.js',
				'<%= pkg.buildPath %>js/app/**/*.js'
			],
			options: {
				smarttabs: true,
				supernew: true,
			}
		},
		clean: {
		  css: ["<%= pkg.assetsPath %>css/main-ie*.css"]
		},
		autoprefixer: {
			options: {
				browsers: ['last 2 version', 'ie 8', 'ie 9']
			},
			dist: {
				src: '<%= pkg.assetsPath %>css/*.css'
			}
		},
		modernizr: {

			dist: {
				// [REQUIRED] Path to the build you're using for development.
				"devFile" : "<%= pkg.buildPath %>js/vendor/modernizr-dev.js",

				// [REQUIRED] Path to save out the built file.
				"outputFile" : "<%= pkg.buildPath %>js/head/modernizr-custom.js",

				// Based on default settings on http://modernizr.com/download/
				"extra" : {
					"shiv" : true,
					"printshiv" : false,
					"load" : true,
					"mq" : false,
					"cssclasses" : true
				},

				// Based on default settings on http://modernizr.com/download/
				"extensibility" : {
					"addtest" : false,
					"prefixed" : false,
					"teststyles" : false,
					"testprops" : false,
					"testallprops" : false,
					"hasevents" : false,
					"prefixes" : false,
					"domprefixes" : false
				},

				// By default, source is uglified before saving
				"uglify" : false,

				// Define any tests you want to implicitly include.
				"tests" : ['flexbox'],

				// By default, this task will crawl your project for references to Modernizr tests.
				// Set to false to disable.
				"parseFiles" : true,

				// When parseFiles = true, this task will crawl all *.js, *.css, *.scss files, except files that are in node_modules/.
				// You can override this by defining a "files" array below.
				"files" : {
					"src" : [
						'<%= pkg.buildPath %>scss/**/*.scss',
						'<%= pkg.buildPath %>js/**/*.js'
					]
				},
				//"src": []
			},

			// When parseFiles = true, matchCommunityTests = true will attempt to
			// match user-contributed tests.
			//"matchCommunityTests" : false,

			// Have custom Modernizr tests? Add paths to their location here.
			//"customTests" : []
		},
		watch: {
			options: {
				livereload: true,
			},
			files: [
				'<%= pkg.buildPath %>js/**/*.js',
				// '<%= pkg.buildPath %>assembly/**/*.hbs',
				'**/*.scss'
			],
			tasks: [
				'modernizr',
				'jshint',
				'concat:uc',
				'compass:def',
				'clean',
				'autoprefixer',
				'copy',
				'bless'
			]
		},
		concat: {
			options: {
				separator : ';',
				stripBanners : true,
				banner : ''
			},
			def: {
				files: {
					'<%= pkg.assetsPath %>js/head.js'            : '<%= pkg.buildPath %>js/head/*.js',
					'<%= pkg.assetsPath %>js/<%= pkg.name %>.js' : [
						'<%= pkg.buildPath %>js/vendor/jquery-1.11.1.js',
						'<%= pkg.buildPath %>foundation/js/foundation/foundation.js',
						'<%= pkg.buildPath %>foundation/js/foundation/foundation.tab.js',
						'<%= pkg.buildPath %>foundation/js/foundation/foundation.slider.js',
						'<%= pkg.buildPath %>foundation/js/foundation/foundation.equalizer.js',
						'<%= pkg.buildPath %>foundation/js/foundation/foundation.reveal.js',
						'<%= pkg.buildPath %>js/lib/*.js',
						'<%= pkg.buildPath %>js/app/app.js',
						'<%= pkg.buildPath %>js/app/interface.js',
						'<%= pkg.buildPath %>js/app/modules/*.js'
					],
					'<%= pkg.assetsPath %>js/compat.js'          : [
						'<%= pkg.buildPath %>js/compat/css3-multi-column.js',
						'<%= pkg.buildPath %>js/compat/respond.js'
					],
					'<%= pkg.assetsPath %>js/ie8.js'          : [
						'<%= pkg.buildPath %>js/compat/selectivizr.js',
						'<%= pkg.buildPath %>js/compat/ie8.js'
					]
				}
			},

			uc: {
				files: {
					'<%= pkg.assetsPath %>js/head.<%= pkg.version %>.js' : '<%= pkg.buildPath %>js/head/*.js',
					'<%= pkg.assetsPath %>js/foundation.<%= pkg.version %>.js' : [
						'<%= pkg.buildPath %>foundation/js/foundation/foundation.js',
						'<%= pkg.buildPath %>foundation/js/foundation/foundation.tab.js',
						'<%= pkg.buildPath %>foundation/js/foundation/foundation.accordion.js',
						'<%= pkg.buildPath %>foundation/js/foundation/foundation.slider.js',
						'<%= pkg.buildPath %>foundation/js/foundation/foundation.equalizer.js',
						'<%= pkg.buildPath %>foundation/js/foundation/foundation.reveal.js'
					],

					'<%= pkg.assetsPath %>js/libraries.<%= pkg.version %>.js' : [
						'<%= pkg.buildPath %>js/lib/*.js',
					],

					'<%= pkg.assetsPath %>js/theme.<%= pkg.version %>.js' : [
						'<%= pkg.buildPath %>js/app/app.js',
						'<%= pkg.buildPath %>js/app/modules/*.js',
						'<%= pkg.buildPath %>js/app/interface.js'
					],
					'<%= pkg.assetsPath %>js/compat.<%= pkg.version %>.js' : [
						'<%= pkg.buildPath %>js/compat/css3-multi-column.js',
						'<%= pkg.buildPath %>js/compat/respond.js'
					],
					'<%= pkg.assetsPath %>js/ie8.<%= pkg.version %>.js' : [
						'<%= pkg.buildPath %>js/compat/selectivizr.js',
						'<%= pkg.buildPath %>js/compat/ie8.js'
					]
				}
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
			},
			def: {
				files: {
					'<%= pkg.assetsPath %>js/head.min.js'    : ['<%= pkg.assetsPath %>js/head.js' ],
					'<%= pkg.assetsPath %>js/compat.min.js'    : ['<%= pkg.assetsPath %>js/compat.js' ],
					'<%= pkg.assetsPath %>js/<%= pkg.name %>.min.js' : ['<%= pkg.assetsPath %>js/<%= pkg.name %>.js']
				}
			},
			deps: {
				files: [
					{
						expand: true,     // Enable dynamic expansion.
						cwd:  '<%= pkg.buildPath %>js/plugins/',      // Src matches are relative to this path.
						src: ['**/*.js'], // Actual pattern(s) to match.
						dest: '<%= pkg.assetsPath %>js/plugins/',   // Destination path prefix.
						ext:  '.min.js',   // Dest filepaths will have this extension.
					},
				],
			}
		},

		/*sass: {
			dist:{
				options:{
					compass: true,
					style: 'expanded',
					loadPath: [
						'<%= pkg.buildPath %>foundation/scss',
						'<%= pkg.assetsPath %>imgs',
					],
				},
				files: {
					'main.css' : 'main.scss',
					'main.<%= pkg.version %>.css' : '<%= pkg.buildPath %>/scss/main.scss',
				}
			}
		},*/
		compass: {
			def: {
				options: {
					sassDir:   '<%= pkg.buildPath %>scss',
					importPath:'<%= pkg.buildPath %>foundation/scss',
					cssDir:    '<%= pkg.assetsPath %>css',
					imagesDir: '<%= pkg.assetsPath %>imgs',
					relativeAssets: true,
				}
			},
			prod: {
				options: {
					sassDir:   '<%= pkg.buildPath %>scss',
					importPath:'<%= pkg.buildPath %>foundation/scss',
					cssDir:    '<%= pkg.assetsPath %>css',
					imagesDir: '<%= pkg.assetsPath %>imgS',
					relativeAssets: true,
					outputStyle: 'compressed',
					environment: 'production',
				}
			}
		},
		imagemin: {
			dynamic: {                         // Another target
				files: [{
					expand: true,                  // Enable dynamic expansion
					cwd: '<%= pkg.buildPath %>img/',                   // Src matches are relative to this path
					src: ['**/*.{png,jpg,gif}'],   // Actual patterns to match
					dest: '<%= pkg.assetsPath %>img/'                  // Destination path prefix
				}]
			}
		},
		copy:{
			main:{
				src: '<%= pkg.assetsPath %>css/main.css',
				dest: '<%= pkg.assetsPath %>css/main.<%= pkg.version %>.css'
			}
		},

		bless: {
		    css: {
				options: {
					cacheBuster: false,
					logCount: true
				},
				files: {
					'<%= pkg.assetsPath %>css/main-ie.<%= pkg.version %>.css': '<%= pkg.assetsPath %>css/main.<%= pkg.version %>.css'
				}
		    }
		  }
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-compass');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	// grunt.loadNpmTasks('assemble');
	grunt.loadNpmTasks('grunt-modernizr');
	grunt.loadNpmTasks('grunt-autoprefixer');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-bless');

	// Default task(s).
	grunt.registerTask('default',    ['modernizr', 'jshint', 'concat:uc', 'compass:def', 'clean', 'autoprefixer', 'copy', 'bless']);
	grunt.registerTask('production', ['modernizr', 'jshint', 'concat:uc', 'uglify', 'compass:def', 'clean', 'autoprefixer', 'copy', 'bless']);
	grunt.registerTask('ultracart', ['concat:uc']);
};
