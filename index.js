var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/final');

mongoose.set('debug', true);


var schema = mongoose.Schema({
      NIC : { type: Number, index: true },
      Name : String,
      Balance : Number,
      DueDate : Date,
      Area : String,
      Group : { type: Number, index: true },
      Trans : Array
})

var user = mongoose.model('user',schema);

////////////////////////////////////////////////////////////////////////////////////

app.post('/adduser', function (req, res) {
  
  var add = new user({
      NIC : parseInt(req.body.id),
      Name : req.body.name,
      Balance : parseInt(req.body.amount) ,
      DueDate : new Date(req.body.date),
      Area : req.body.area,
      Group : parseInt(req.body.gid),
  });

  add.save(function (err) {
    if (err) // ...
    console.log('done')
    res.end('Done')
  });
});
  
////////////////////////////////////////////////////////////////////////////////////

app.post('/transaction', function (req, res) {
  var due;
  var bal;
  var id;
  
  console.log(req.body.id);
   
  user.findOne({ 'NIC': req.body.id }, 'DueDate Balance', function (err, user) {
      id =  req.body.id; 
      due = user.DueDate;
      due.setDate(due.getDate() + 30);
      bal = user.Balance;
      bal = bal - req.body.amount;
      update();
  });
  
  
  function update(){
    
    var now = new Date();
    now.setHours(now.getHours() + 5.5);
    
    user.update({ 'NIC' : id },{  
      $set : {
          DueDate : new Date(due).toUTCString(),
          Balance : bal
      },
      $push: {
          'Trans': {
                amount:200,
                date: now 
                   }
            }
    },function(err, store) {});
    
    res.json("Done");
     
  }    
});

////////////////////////////////////////////////////////////////////////////////////



app.get('/find/:id', function(req, res){
   
  user.findOne({ 'NIC': req.params.id }, 'NIC Name Area DueDate', function (err, user) {

    if (err) return handleError(err);
  
    res.json({
        Name : user.Name,
        Area : user.Area,
        DueDate : user.DueDate      
    });
  })
});

///////////////////////////////////////////////////////////////////////////////////

app.get('/groupinfo/:id', function(req, res){
  
    user.find({'Group' : req.params.id  }, 'NIC Name Area DueDate Balance -_id', function (err, users) {
       res.json(users);
  })
  
  
});

///////////////////////////////////////////////////////////////////////////////////



app.get('/users', function(req, res){
   
  user.find({}, 'NIC Name Area DueDate Balance -_id', function (err, users) {     
   res.json(users);
   
  })
});

/////////////////////////////////////////////////////////////////////////////////


app.get('/findtrans/:id', function (req, res) {

    user.findOne({ 'NIC': req.params.id }, function (err, user) {

    if (err) return handleError(err);
    
        var lasttwo = user.Trans.slice(-2);
  
        console.log(user.Trans);
        res.json(lasttwo);
    })      
    
});

////////////////////////////////////////////////////////////////////////////////

app.get('/group.summary', function(req, res){
  user.aggregate(
        { $group: {
            _id: "$Group",
            number : { $sum : 1},
            balance: { $sum: "$Balance"  }
        }}
    , function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        console.log(result);
        res.json(result);
    }); 
});



/////////////////////////////////////////////////////////////////////////////


app.get('/recent', function (req, res) {
      
      var now = new Date();
      var cutoff = new Date();
      cutoff.setDate(now.getDate()+40);
     
      user.find({DueDate : {"$gte": now , "$lt": cutoff }}, function (err, user) {
          if (err) return handleError(err);
              res.json(user);
      })   
});

////////////////////////////////////////////////////////////////////////////

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});