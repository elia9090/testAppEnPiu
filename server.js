var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyParser = require("body-parser");

var config = require('./config');
//LOGGER
var log4js = require('log4js');
log4js.configure('./config/log4js.json');
var log = log4js.getLogger("server");


//STATIC FILES
app.use(express.static('public'));
//app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Body parser use JSON data
app.use(bodyParser.urlencoded({ extended: true }));
/*MY SQL Connection Info*/
var pool = mysql.createPool({
	connectionLimit : config.connLimit,
	host     : config.DbHost,
	user     : config.DbUser,
	password : config.DbPassword,
	database : config.DbName,
	port : config.DbPort
});

log.debug('Server is starting....');


// ROOT - Loads Angular App
app.get('/', function (req, res) {
	res.sendFile( __dirname + "/public/" + "index.html" );
});
app.get('/dashboard', function (req, res) {
	res.send( __dirname + "/public/" + "dashboard.html" );
});

// This responds a POST request for the /LOGIN page.
app.post('/login', function (req, res) {
	
	console.log("post :: /login");
	log.info('post Request :: /login');
	var data = {
        "error": 1,
        "utenteOk": ""
    };
	var username = req.body.username;
    var password = req.body.password;
	pool.getConnection(function (err, connection) {
		connection.query('SELECT * from UTENTI where USERNAME = ? and PASSWORD = ?', [username,  password], function (err, rows, fields) {
			connection.release();

			if (rows.length !== 0 && !err) {
				data["error"] = 0;
				data["utenteOk"] = rows;
				res.redirect('/dashboard');
			} else if (rows.length === 0) {
				//Error code 2 = no rows in db.
				data["error"] = 2;
				data["utenteOk"] = 'No products Found..';
				res.json(data);
			} else {
				data["utenti"] = 'error while performing query';
				res.json(data);
				console.log('Error while performing Query: ' + err);
				log.error('Error while performing Query: ' + err);
			}
		});
	
	});
});

//UPDATE Product
app.put('/api/update', function (req, res) {
    var id = req.body.id;
    var name = req.body.name;
    var description = req.body.description;
    var price = req.body.price;
    var data = {
        "error": 1,
        "product": ""
    };
	console.log('PUT Request :: /update: ' + id);
	log.info('PUT Request :: /update: ' + id);
    if (!!id && !!name && !!description && !!price) {
		pool.getConnection(function (err, connection) {
			connection.query("UPDATE products SET name = ?, description = ?, price = ? WHERE id=?",[name,  description, price, id], function (err, rows, fields) {
				if (!!err) {
					data["product"] = "Error Updating data";
					console.log(err);
					log.error(err);
				} else {
					data["error"] = 0;
					data["product"] = "Updated Book Successfully";
					console.log("Updated: " + [id, name, description, price]);
					log.info("Updated: " + [id, name, description, price]);
				}
				res.json(data);
			});
		});
    } else {
        data["product"] = "Please provide all required data (i.e : id, name, desc, price)";
        res.json(data);
    }
});

//LIST Product by ID
app.get('/api/list/:id', function (req, res) {
	var id = req.params.id;
	var data = {
        "error": 1,
        "product": ""
    };
	
	console.log("GET request :: /list/" + id);
	log.info("GET request :: /list/" + id);
	pool.getConnection(function (err, connection) {
		connection.query('SELECT * from products WHERE id = ?', id, function (err, rows, fields) {
			connection.release();
			
			if (rows.length !== 0 && !err) {
				data["error"] = 0;
				data["product"] = rows;
				res.json(data);
			} else {
				data["product"] = 'No product Found..';
				res.json(data);
				console.log('Error while performing Query: ' + err);
				log.error('Error while performing Query: ' + err);
			}
		});
	
	});
});

//INSERT new product
app.post('/api/insert', function (req, res) {
    var name = req.body.name;
    var description = req.body.description;
    var price = req.body.price;
    var data = {
        "error": 1,
        "products": ""
    };
	console.log('POST Request :: /insert: ');
	log.info('POST Request :: /insert: ');
    if (!!name && !!description && !!price) {
		pool.getConnection(function (err, connection) {
			connection.query("INSERT INTO products SET name = ?, description = ?, price = ?",[name,  description, price], function (err, rows, fields) {
				if (!!err) {
					data["products"] = "Error Adding data";
					console.log(err);
					log.error(err);
				} else {
					data["error"] = 0;
					data["products"] = "Product Added Successfully";
					console.log("Added: " + [name, description, price]);
					log.info("Added: " + [name, description, price]);
				}
				res.json(data);
			});
        });
    } else {
        data["products"] = "Please provide all required data (i.e : name, desc, price)";
        res.json(data);
    }
});

app.post('/api/delete', function (req, res) {
    var id = req.body.id;
    var data = {
        "error": 1,
        "product": ""
    };
	console.log('DELETE Request :: /delete: ' + id);
	log.info('DELETE Request :: /delete: ' + id);
    if (!!id) {
		pool.getConnection(function (err, connection) {
			connection.query("DELETE FROM products WHERE id=?",[id],function (err, rows, fields) {
				if (!!err) {
					data["product"] = "Error deleting data";
					console.log(err);
					log.error(err);
				} else {
					data["product"] = 0;
					data["product"] = "Delete product Successfully";
					console.log("Deleted: " + id);
					log.info("Deleted: " + id);
				}
				res.json(data);
			});
		});
    } else {
        data["product"] = "Please provide all required data (i.e : id ) & must be a integer";
        res.json(data);
    }
});

var server = app.listen(8081, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("dummy app listening at: " + host + ":" + port);

})