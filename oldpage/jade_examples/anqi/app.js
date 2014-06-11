
/**
 * Module dependencies.
 */

var express = require('express');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res){
  res.render('index', { title: 'Test for TAG' });
});

app.post('/documents', function(req, res) {
     //Read values from your form
     var username = req.param('username');
     var password = req.param('password');
     var tag = req.param('tag');
     
     //Show the list of documents or an error,
     //depending on whether they're British.
     
     if (tag) {
         if (username == 'anqi' && password == 'anqi')
            res.render("doc1.jade", {title: "Top Secret"});
         else
            res.render("doc2.jade", {title: "Top Secret"});   
     }
     
     else res.render("err.jade", {title: "Error occurred"}); 

});

app.listen(3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
