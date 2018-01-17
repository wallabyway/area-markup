// don't forget:  npm install mysql express
'use strict'
const express = require('express')
const app = express();
const bodyParser = require('body-parser')
const mysql = require('mysql');

// static web server
app.use(express.static(__dirname + '/../docs'));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


// connect to MySQL hosted on Amazon RDS
var connection = mysql.createConnection({
    host: process.env.MYSQL_host,
    user: process.env.MYSQL_user,
    password: process.env.MYSQL_password,
    database: process.env.MYSQL_database
});


// Get all markup's from MySQL
app.get('/allMarkup', (req, res) => {
    connection.query('CALL queryApproval(?)',[req.query.approvalid], function(err, rows) {
        if (err) throw err;
        res.status(200).send( JSON.stringify(rows[0]) );
    });
});

// Get markupID=x from MySQL
app.get('/markup', (req, res) => {
    connection.query('SELECT * from Markup WHERE markupID=(?)',[req.query.markupID], function(err, rows) {
        if (err) throw err;
        res.status(200).send( JSON.stringify(rows[0]) );
    });
});


// Save markup to MySQL
app.use(bodyParser.json());
app.post('/savemarkup',  (req, res) => {
	let i = req.body;
	// INSERT INTO `Markup` (`UserID`, `sqrfoot`, `ApprovalState`, `json`) VALUES  (?,?,?,?)
    connection.query('INSERT INTO `Markup` (`UserID`, `sqrfoot`, `ApprovalID`, `dwgID`, `json`) VALUES  (?,?,?,?,?)',[i.UserID, i.sqrfoot, 1,1, i.json], function(err, rows) {
        if (err) throw err;
        res.status(200);
    });
});


app.listen(3000); console.log('started on port 3000'); // <-- uncomment this line for local debugging, then type: >node app.js

module.exports = app;