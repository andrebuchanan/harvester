module.exports = function(grunt) {

  // Load all grunt tasks.
  require("load-grunt-tasks")(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    nodemon: {
      control: {
        options: {
          file: "control.js",
          env: { CONTROLLER_SECRET: "hashkey" },
          args: ["3001"],
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
  grunt.registerTask("serve", ["nodemon:control"]);
};