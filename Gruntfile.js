module.exports = function(grunt) {

  // Load all grunt tasks.
  require("load-grunt-tasks")(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    nodemon: {
      controller: {
        options: {
          file: "control.js",
          args: ["3001"],
          watchedFolders: ["./lib"]
        }
      },
      harvester: {
        options: {
          file: "harvester.js",
          watchedFolders: ["./lib"]
        }
      },
      handler: {
        options: {
          file: "handler.js",
          args: ["3000"],
          watchedFolders: ["./lib"]
        }
      }
    },
    // Need to install bower components.
    bower: {
      install: {
        options: {
          install: true,
          targetDir: "./controller/bower_components",
          cleanBowerDir: true
        }
      }
    }
  });

  grunt.registerTask("default", ["nodemon:control"]);
  grunt.registerTask("build", ["bower"]);
  grunt.registerTask("controller", ["bower", "nodemon:controller"]);
  grunt.registerTask("harvester", ["nodemon:harvester"]);
  grunt.registerTask("handler", ["nodemon:handler"]);
};