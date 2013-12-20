module.exports = function(grunt) {

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
    }
  });

  grunt.loadNpmTasks("grunt-nodemon");

  grunt.registerTask("default", ["nodemon:control"]);
  grunt.registerTask("serve", ["nodemon:control"]);
};