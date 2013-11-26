# Prerequisites
1. Install NodeJS from [http://nodejs.org/](http://nodejs.org/)
2. Open a command prompt and navigate to the project's root directory (where you cloned the repository)
3. Run the command "npm install" to install grunt and its plugins
4. Run the command "npm install -g grunt-cli" to install grunt command line globally

# Basic Build (debug)
Run "grunt" from the project's root directory. 

# Other Tasks
- Run "grunt watch" to start watching for any changes to automatically be built.
- Run "grunt ship" to build the ship-ready version of the site

# Local Hosting
Set up a web server pointing to the web directory for RIN or everest/web for Everest. Our requirements are minimal so IIS Express, Apache, or any other web server will work. 

One easy option is [Mongoose](https://code.google.com/p/mongoose/) which is a simple standalone executable. Just download it your web directory, run the executable, and then browse to: [http://localhost:8080/](http://localhost:8080/)

