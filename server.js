var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyParser = require("body-parser");

var jwt = require('jsonwebtoken');
var config = require('./config');
//LOGGER
var log4js = require('log4js');
log4js.configure('./config/log4js.json');
var log = log4js.getLogger("server");


//STATIC FILES
app.use(express.static(__dirname + '/public'));


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




// This responds a POST request for the /LOGIN page.
app.post('/login', function (req, res) {
	console.log("post :: /login");
	log.info('post Request :: /login');

	var data = {};
	
	var username = req.body.username;
    var password = req.body.password;
	pool.getConnection(function (err, connection) {
		connection.query('SELECT * from UTENTI where USERNAME = ? and PASSWORD = ?', [username,  password], function (err, rows, fields) {
			connection.release();
			if (rows.length !== 0 && !err) {
				data["utente"] = rows[0];
				const user = rows[0];
				const token = jwt.sign({ user: rows[0].ID_UTENTE }, config.secretKey,{expiresIn: "1h"});
				data["token"] = token;
				res.json(data);
			} else if (rows.length === 0) {
				//Error code 2 = no rows in db.
				data["error"] = 2;
				data["utente"] = 'Nome utente o password errati';
				res.status(404).json(data);
			} else {
				data["utenti"] = 'Errore in fase di login';
				res.status(500).json(data);
				console.log('Errore in fase di login: ' + err);
				log.error('Errore in fase di login: ' + err);
			}
		});
	
	});
});

//Create user
app.get('/listaOperatoriWS', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
		} else {
			var data = {};
			pool.getConnection(function (err, connection) {
				connection.query('SELECT * from UTENTI where TIPO = "OPERATORE" ' , function (err, rows, fields) {
					connection.release();
					if (rows.length !== 0 && !err) {
						data["operatori"] = rows;
						res.json(data);
					} else if (rows.length === 0) {
						//Error code 2 = no rows in db.
						data["error"] = 2;
						data["operatori"] = 'Nessun operatore trovato';
						res.status(404).json(data);
					} else {
						data["operatori"] = 'Errore in fase di reperimento operatori';
						res.status(500).json(data);
						console.log('Errore in fase di reperimento operatori: ' + err);
						log.error('Errore in fase di reperimento operatori: ' + err);
					}
				});
			
			});
		  
		}
	});
});
app.get('/listaResponsabiliAgentiWS', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
		} else {
			var data = {};
			pool.getConnection(function (err, connection) {
				connection.query('SELECT * from UTENTI where TIPO = "RESPONSABILE_AGENTI" ' , function (err, rows, fields) {
					connection.release();
					if (rows.length !== 0 && !err) {
						data["responsabili"] = rows;
						res.json(data);
					} else if (rows.length === 0) {
						//Error code 2 = no rows in db.
						data["error"] = 2;
						data["responsabili"] = 'Nessun responsabile trovato';
						res.status(404).json(data);
					} else {
						data["responsabili"] = 'Errore in fase di reperimento responsabili';
						res.status(500).json(data);
						console.log('Errore in fase di reperimento responsabili: ' + err);
						log.error('Errore in fase di reperimento responsabili: ' + err);
					}
				});
			
			});
		  
		}
	});
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
app.all("/*", function(req, res, next) {
	res.sendfile("index.html", { root: __dirname + "/public" });
});


function ensureToken(req, res, next) {
	const bearerHeader = req.headers["authorization"];
	if (typeof bearerHeader !== 'undefined') {
	  const bearer = bearerHeader.split(" ");
	  const bearerToken = bearer[1];
	  req.token = bearerToken;
	  next();
	} else {
	  res.sendStatus(403);
	}
  }


var server = app.listen(8081, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("dummy app listening at: " + host + ":" + port);

})