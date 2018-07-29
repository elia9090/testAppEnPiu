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
var sha1 = require('sha1');
/*
app.listen(3000,'192.168.1.187' || 'localhost',function() {
    console.log('Application worker  started...');
  }
  );*/



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






// This responds a POST request for the /LOGIN page.
app.post('/login', function (req, res) {
	console.log("post :: /login");
	log.info('post Request :: /login');

	var data = {};
	
	var username = req.body.username;
	var password = sha1(req.body.password);
	
	pool.getConnection(function (err, connection) {
		connection.query('SELECT * from UTENTI where USERNAME = ? and PASSWORD = ? and UTENTE_ATTIVO = 1', [username,  password], function (err, rows, fields) {
			connection.release();
			if (rows.length !== 0 && !err) {
				data["utente"] = rows[0];
				const user = rows[0];
				const token = jwt.sign({ user: rows[0].ID_UTENTE }, config.secretKey,{expiresIn: "8h"});
				data["token"] = token;
				if(rows[0].EDIT_PASSWORD == 1){
					data["editPassword"] = "1";
				}else{
					data["editPassword"] = "0";
				}
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
//UPDATE PASSWORD
app.post('/editPassword', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
	} else {
	console.log("post :: /editPassword");
	log.info('post Request :: /editPassword');

	var data = {};
	
	var id = parseInt(req.body.userId);
	var password = sha1(req.body.password);

	pool.getConnection(function (err, connection) {
		connection.beginTransaction(function(errTrans) {
			if (errTrans) {                  //Transaction Error (Rollback and release connection)
				connection.rollback(function() {
				connection.release();
				});
				res.sendStatus(500);
			}else{
				connection.query('UPDATE UTENTI SET PASSWORD=?, EDIT_PASSWORD=0 WHERE ID_UTENTE= ?', [password, id ], function (err, rows, fields) {
					if(err){
						connection.rollback(function() {
						connection.release();
						//Failure
						});
						log.error('ERRORE SQL UPDATE password UTENTE: ' + err);
						//errore username duplicato
						
							res.sendStatus(500);
							
					}else{
						connection.commit(function(err) {
							if (err) {
								connection.rollback(function() {
								connection.release();
								//Failure
								});
								res.sendStatus(500);
							} else {
								connection.release();
								data["RESULT"] = "OK";
								res.json(data);
								//Success
							}
						});
					}
					
				});
			}
		});
	
		
	});
	}
});
});


// INSERT USER
app.post('/addUser', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
	} else {
	console.log("post :: /addUser");
	log.info('post Request :: /addUser');

	var data = {};
	
	var username = req.body.username;
	var password = sha1(req.body.password);
	var nome = req.body.nome;
	var cognome = req.body.cognome;
	var userType = req.body.userType;
	var operatoreAssociato = req.body.operatoreAssociato;
	var responsabileAssociato = req.body.responsabileAssociato;

	pool.getConnection(function (err, connection) {
		connection.beginTransaction(function(errTrans) {
			if (errTrans) {                  //Transaction Error (Rollback and release connection)
				connection.rollback(function() {
				connection.release();
				});
				res.sendStatus(500);
			}else{
				connection.query('INSERT INTO UTENTI (ID_UTENTE, NOME, COGNOME, TIPO, USERNAME, PASSWORD)VALUES (NULL, ?, ?, ?, ?, ?)', [nome,cognome,userType,username, password], function (err, rows, fields) {
					if(err){
						connection.rollback(function() {
						connection.release();
						//Failure
						});
						log.error('ERRORE SQL INSERT UTENTE: ' + err);
						//errore username duplicato
						if(err.errno == 1062){
							res.sendStatus(400);
						}else{
							res.sendStatus(500);
							
						}
							
					}else{
						// se l'usertype è l'operatore faccio il commit ed esco
						if(userType === 'OPERATORE'){
							connection.commit(function(err) {
								if (err) {
									connection.rollback(function() {
									connection.release();
									//Failure
									});
									res.sendStatus(500);
								} else {
									connection.release();
									data["RESULT"] = "OK";
									res.json(data);
									//Success
								}
							});
						}else if(userType === 'RESPONSABILE_AGENTI'){
							var insertedId = rows.insertId;
							connection.query('INSERT INTO OPERATORI_VENDITORI (ID_ASSOCIAZIONE, ID_AGENTE, ID_OPERATORE, DATA_INIZIO_ASS, DATA_FINE_ASS)VALUES (NULL, ?, ?, CURDATE(), NULL)', [insertedId,operatoreAssociato], function (err, rows, fields) {
								if(err){
									connection.rollback(function() {
									connection.release();
									//Failure
									});
									log.error('ERRORE SQL INSERT UTENTE: ' + err);
									//errore username duplicato
									if(err.errno == 1062){
										res.sendStatus(400);
									}else{
										res.sendStatus(500);
										
									}
										
								}else{
								connection.commit(function(err) {
									if (err) {
										connection.rollback(function() {
										connection.release();
										//Failure
										});
										res.sendStatus(500);
									} else {
										connection.release();
										data["RESULT"] = "OK";
										res.json(data);
										//Success
									}
								});
							}
							});
						}
						else if(userType === 'AGENTE'){
							if(operatoreAssociato){
							var insertedId = rows.insertId;
							connection.query('INSERT INTO OPERATORI_VENDITORI (ID_ASSOCIAZIONE, ID_AGENTE, ID_OPERATORE, DATA_INIZIO_ASS, DATA_FINE_ASS)VALUES (NULL, ?, ?, CURDATE(), NULL)', [insertedId,operatoreAssociato], function (err, rows, fields) {
								if(err){
									connection.rollback(function() {
									connection.release();
									//Failure
									});
									log.error('ERRORE SQL INSERT UTENTE: ' + err);
									//errore username duplicato
									if(err.errno == 1062){
										res.sendStatus(400);
									}else{
										res.sendStatus(500);
										
									}
										
								}
							});
						}
						if(responsabileAssociato){
							connection.query('INSERT INTO RESPONSABILI_AGENTI (ID_ASSOCIAZIONE, ID_RESPONSABILE, ID_AGENTE, DATA_INIZIO_ASS, DATA_FINE_ASS)VALUES (NULL, ?, ?, CURDATE(), NULL)', [responsabileAssociato,insertedId], function (err, rows, fields) {
								if(err){
									connection.rollback(function() {
									connection.release();
									//Failure
									});
									log.error('ERRORE SQL INSERT UTENTE: ' + err);
									//errore username duplicato
									if(err.errno == 1062){
										res.sendStatus(400);
									}else{
										res.sendStatus(500);
										
									}
										
								}
							});
						}
						connection.commit(function(err) {
								if (err) {
									connection.rollback(function() {
									connection.release();
									res.sendStatus(500);
									
									});
								} else {
									connection.release();
									data["RESULT"] = "OK";
									res.json(data);
									//Success
								}
							});
						}
						// prendo l'id utente poco prima inserito e vado a salvare l'associazione operatore-venditore
						
						
						
					}
					
				});
			}
		});
	
		
	});
	}
});
});



// UPDATE USER
app.post('/updateUser', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function (err, data) {
		if (err) {
			res.sendStatus(403);
		} else {
			console.log("post :: /updateUser");
			log.info('post Request :: /updateUser');

			var data = {};
			var userId = req.body.userId;
			var username = req.body.username;
			var password = sha1(req.body.password);
			var nome = req.body.nome;
			var cognome = req.body.cognome;
			var userType = req.body.userType;

			pool.getConnection(function (err, connection) {
				connection.beginTransaction(function (errTrans) {
					if (errTrans) {                  //Transaction Error (Rollback and release connection)
						connection.rollback(function () {
							connection.release();
						});
						res.sendStatus(500);
					} else {
						var querystring = '';
						var params = [];
						if (password == '') {
							queryString = 'UPDATE UTENTI SET  NOME=?, COGNOME=?, TIPO=?, USERNAME=? WHERE ID_UTENTE=?';
							params = [nome, cognome, userType, username, userId]
						}
						else {
							queryString = 'UPDATE UTENTI SET  NOME=?, COGNOME=?, TIPO=?, USERNAME=?, PASSWORD=?, EDIT_PASSWORD=1 WHERE ID_UTENTE=?';
							params = [nome, cognome, userType, username, password, userId]
						}
						connection.query(queryString, params, function (err, rows, fields) {
							if (err) {
								connection.rollback(function () {
									connection.release();
									//Failure
								});
								log.error('ERRORE SQL INSERT UTENTE: ' + err);
								//errore username duplicato
								if (err.errno == 1062) {
									res.sendStatus(400);
								} else {
									res.sendStatus(500);

								}

							} else {

								connection.commit(function (err) {
									if (err) {
										connection.rollback(function () {
											connection.release();
											//Failure
										});
										res.sendStatus(500);
									} else {
										connection.release();
										data["RESULT"] = "OK";
										res.json(data);
										//Success
									}
								})
							}

						})

					}

				})
			})

		}

	})
});
	


// UPDATE OPERATORE ASSOCIATO ALL'UTENTE MODIFICATO
app.post('/updateOperatore', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function (err, data) {
		if (err) {
			res.sendStatus(403);
		} else {
			console.log("post :: /updateUser");
			log.info('post Request :: /updateUser');

			var data = {};
			var userId = req.body.userId;
			var oldOperatore = req.body.oldOperatore;
			var newOperatore = req.body.newOperatore;

			pool.getConnection(function (err, connection) {
				connection.beginTransaction(function (errTrans) {
					if (errTrans) {                  //Transaction Error (Rollback and release connection)
						connection.rollback(function () {
							connection.release();
						});
						res.sendStatus(500);
					} else {
						if (oldOperatore != null) {
							connection.query('UPDATE OPERATORI_VENDITORI SET  DATA_FINE_ASS=sysdate()  WHERE ID_AGENTE=? and ID_OPERATORE=?  and  DATA_FINE_ASS is null ', [userId, oldOperatore], function (err, rows, fields) {
								if (err) {
									connection.rollback(function () {
										connection.release();
										//Failure
									});
									log.error('ERRORE SQL INSERT UTENTE: ' + err);
									//errore username duplicato
									if (err.errno == 1062) {
										res.sendStatus(400);
									} else {
										res.sendStatus(500);

									}

								} else {

									connection.commit(function (err) {
										if (err) {
											connection.rollback(function () {
												connection.release();
												//Failure
											});
											res.sendStatus(500);
										} else {

										}
									})
								}

							})
						}
						if (newOperatore != null) {
							connection.query('INSERT INTO OPERATORI_VENDITORI (ID_AGENTE, ID_OPERATORE, DATA_INIZIO_ASS, DATA_FINE_ASS) VALUES(?,?,SYSDATE(), null) ', [userId, newOperatore], function (err, rows, fields) {
								if (err) {
									connection.rollback(function () {
										connection.release();
										//Failure
									});
									log.error('ERRORE SQL INSERT UTENTE: ' + err);
									//errore username duplicato
									if (err.errno == 1062) {
										res.sendStatus(400);
									} else {
										res.sendStatus(500);

									}
								} else {

									connection.commit(function (err) {
										if (err) {
											connection.rollback(function () {
												connection.release();
												//Failure
											});
											res.sendStatus(500);
										} else {

										}
									})
								}

							})
						}

					}
					connection.release();
					data["RESULT"] = "OK";
					res.json(data);
					//Success
				})
			})
		}
	})
});



// UPDATE RESPONSABILE ASSOCIATO ALL'UTENTE MODIFICATO
app.post('/updateResponsabile', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function (err, data) {
		if (err) {
			res.sendStatus(403);
		} else {
			console.log("post :: /updateResponsabile");
			log.info('post Request :: /updateResponsabile');

			var data = {};
			var userId = req.body.userId;
			var oldResponsabile = req.body.oldResponsabile;
			var newResponsabile = req.body.newResponsabile;

			pool.getConnection(function (err, connection) {
				connection.beginTransaction(function (errTrans) {
					if (errTrans) {                  //Transaction Error (Rollback and release connection)
						connection.rollback(function () {
							connection.release();
						});
						res.sendStatus(500);
					} else {
						if (oldResponsabile != null) {
							connection.query('UPDATE RESPONSABILI_AGENTI SET  DATA_FINE_ASS=sysdate()  WHERE ID_AGENTE=? and ID_RESPONSABILE=? and  DATA_FINE_ASS is null', [userId, oldResponsabile], function (err, rows, fields) {
								if (err) {
									connection.rollback(function () {
										connection.release();
										//Failure
									});
									log.error('ERRORE SQL UPDATE RESPONSABILI_AGENTI: ' + err);
									//errore username duplicato
									if (err.errno == 1062) {
										res.sendStatus(400);
									} else {
										res.sendStatus(500);

									}

								} else {

									connection.commit(function (err) {
										if (err) {
											connection.rollback(function () {
												connection.release();
												//Failure
											});
											res.sendStatus(500);
										} else {

										}
									})
								}

							})
						}
						if (newResponsabile != null) {
							connection.query('INSERT INTO RESPONSABILI_AGENTI (ID_AGENTE, ID_RESPONSABILE, DATA_INIZIO_ASS, DATA_FINE_ASS) VALUES(?,?,SYSDATE(), null) ', [userId, newResponsabile], function (err, rows, fields) {
								if (err) {
									connection.rollback(function () {
										connection.release();
										//Failure
									});
									log.error('ERRORE SQL INSERT INTO RESPONSABILI_AGENTI : ' + err);
									//errore username duplicato
									if (err.errno == 1062) {
										res.sendStatus(400);
									} else {
										res.sendStatus(500);

									}

								} else {

									connection.commit(function (err) {
										if (err) {
											connection.rollback(function () {
												connection.release();
												//Failure
											});
											res.sendStatus(500);
										} else {

										}
									})
								}

							})
						}

					}
					connection.release();
					data["RESULT"] = "OK";
					res.json(data);
					//Success
				})
			})
		}
	})
});


// DELETE USER
app.post('/deleteUser', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function (err, data) {
		if (err) {
			res.sendStatus(403);
		} else {
			console.log("post :: /deleteUser");
			log.info('post Request :: /deleteUser');

			var data = {};
			var userId = req.body.userId;
			

			pool.getConnection(function (err, connection) {
				connection.beginTransaction(function (errTrans) {
					if (errTrans) {                  //Transaction Error (Rollback and release connection)
						connection.rollback(function () {
							connection.release();
						});
						res.sendStatus(500);
					} else {
						var querystring = '';
						var params = [];
							queryString = 'UPDATE UTENTI SET  UTENTE_ATTIVO=0 WHERE ID_UTENTE=?';
							params = [ userId]
						
						
						connection.query(queryString, params, function (err, rows, fields) {
							if (err) {
								connection.rollback(function () {
									connection.release();
									//Failure
								});
								log.error('ERRORE SQL INSERT UTENTE: ' + err);
								//errore username duplicato
								if (err.errno == 1062) {
									res.sendStatus(400);
								} else {
									res.sendStatus(500);

								}

							} else {

								connection.commit(function (err) {
									if (err) {
										connection.rollback(function () {
											connection.release();
											//Failure
										});
										res.sendStatus(500);
									} else {
										connection.release();
										data["RESULT"] = "OK";
										res.json(data);
										//Success
									}
								})
							}

						})

					}

				})
			})

		}

	})
});
	

























//lsita operatori
app.get('/listaOperatoriWS', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
			
		} else {
			var data = {};
			pool.getConnection(function (err, connection) {
				connection.query('SELECT * from UTENTI where TIPO = "OPERATORE" AND UTENTE_ATTIVO = 1' , function (err, rows, fields) {
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
//lsita Agenti non relazionati agli operatori
app.get('/listaAgentiNoRelationWithOperatorWS', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
			
		} else {
			var data = {};
			pool.getConnection(function (err, connection) {
				connection.query('SELECT * from UTENTI where (TIPO = "AGENTE" OR TIPO = "RESPONSABILE_AGENTI") AND UTENTE_ATTIVO = 1' , function (err, rows, fields) {
					connection.release();
					if (rows.length !== 0 && !err) {
						data["agenti"] = rows;
						res.json(data);
					} else if (rows.length === 0) {
						//Error code 2 = no rows in db.
						data["error"] = 2;
						data["agenti"] = 'Nessun agente trovato';
						res.status(404).json(data);
					} else {
						data["agenti"] = 'Errore in fase di reperimento agenti';
						res.status(500).json(data);
						console.log('Errore in fase di reperimento agenti: ' + err);
						log.error('Errore in fase di reperimento agenti: ' + err);
					}
				});
			
			});
		  
		}
	});
});
//lsita Agenti non relazionati agli operatori E ELIMINATI LOGICAMENTE
app.get('/listaAgentiNoRelationWithOperatorAndUserDeletedWS', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
			
		} else {
			var data = {};
			pool.getConnection(function (err, connection) {
				connection.query('SELECT * from UTENTI where (TIPO = "AGENTE" OR TIPO = "RESPONSABILE_AGENTI") ' , function (err, rows, fields) {
					connection.release();
					if (rows.length !== 0 && !err) {
						data["agenti"] = rows;
						res.json(data);
					} else if (rows.length === 0) {
						//Error code 2 = no rows in db.
						data["error"] = 2;
						data["agenti"] = 'Nessun agente trovato';
						res.status(404).json(data);
					} else {
						data["agenti"] = 'Errore in fase di reperimento agenti';
						res.status(500).json(data);
						console.log('Errore in fase di reperimento agenti: ' + err);
						log.error('Errore in fase di reperimento agenti: ' + err);
					}
				});
			
			});
		  
		}
	});
});


//lsita utenti
app.get('/listaUtenti', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
			
		} else {
			var data = {};
			pool.getConnection(function (err, connection) {
				connection.query('SELECT * from UTENTI WHERE UTENTE_ATTIVO=1 ' , function (err, rows, fields) {
					connection.release();
					if (rows.length !== 0 && !err) {
						data["utenti"] = rows;
						res.json(data);
					} else if (rows.length === 0) {
						//Error code 2 = no rows in db.
						data["error"] = 2;
						data["utenti"] = 'Nessun utente trovato';
						res.status(404).json(data);
					} else {
						data["utenti"] = 'Errore in fase di reperimento utente';
						res.status(500).json(data);
						console.log('Errore in fase di reperimento utenti: ' + err);
						log.error('Errore in fase di reperimento utenti: ' + err);
					}
				});
			
			});
		  
		}
	});
});








//Modifica utente
app.get('/edituser/:id', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
			
		} else {
			var id=req.params.id;
			
			pool.getConnection(function (err, connection) {
				connection.query(
			'SELECT * from UTENTI '+
			'LEFT JOIN OPERATORI_VENDITORI OV ON TIPO<>"OPERATORE" AND OV.ID_AGENTE=UTENTI.ID_UTENTE AND OV.DATA_FINE_ASS IS NULL '+
			'LEFT JOIN RESPONSABILI_AGENTI RA ON TIPO="AGENTE" AND RA.ID_AGENTE=UTENTI.ID_UTENTE AND RA.DATA_FINE_ASS IS NULL '+
			'WHERE ID_UTENTE=?' ,
				id, function (err, rows, fields) {
			
					connection.release();
					if(err){
						log.error('ERRORE SQL MODIFICA UTENTE ' + err);
						res.sendStatus(500);
					}else{
						if (rows.length !== 0) {
							data.utente = rows[0];
							res.json(data);
						} else if (rows.length === 0) {
							//Error code 2 = no rows in db.
							data["error"] = 2;
							data.utente = 'Nessun utente trovato';
							res.status(404).json(data);
						} else {
							data["utente"] = 'Errore in fase di reperimento utente';
							res.status(500).json(data);
							console.log('Errore in fase di reperimento utente: ' + err);
							log.error('Errore in fase di reperimento utente: ' + err);
						}
					}
				
				});
			
			});
		  
		}
	});
});



















// NUOVO APPUNTAMENTO
app.post('/addNewDate', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
	} else {
	console.log("post :: /addNewDate");
	log.info('post Request :: /addNewDate');

	var data = {};
	   var dataAppuntamento = req.body.dataAppuntamento;
	   var oraAppuntamento = req.body.oraAppuntamento;
	   var provincia = req.body.provincia;
	   var comune = req.body.comune;
	   var indirizzo = req.body.indirizzo;
	   var idOperatore = req.body.idOperatore;
	   var idAgente = req.body.idAgente;
	   var nomeAttivita = req.body.nomeAttivita;
	   var gestoreAttuale = req.body.gestoreAttuale;
	   var recapiti = req.body.recapiti;
	   var noteOperatore = req.body.noteOperatore;

	pool.getConnection(function (err, connection) {
		connection.beginTransaction(function(errTrans) {
			if (errTrans) {                  //Transaction Error (Rollback and release connection)
				connection.rollback(function() {
				connection.release();
				});
				res.sendStatus(500);
			}else{
				connection.query('INSERT INTO APPUNTAMENTI'
				+'(ID_APPUNTAMENTO, ID_OPERATORE, ID_VENDITORE, DATA_CREAZIONE, DATA_APPUNTAMENTO, ORA_APPUNTAMENTO, PROVINCIA, COMUNE, INDIRIZZO, NOME_ATTIVITA, NOTE_OPERATORE, ATTUALE_GESTORE, RECAPITI)'
				+'VALUES (NULL, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?  )', [idOperatore,idAgente,dataAppuntamento,oraAppuntamento,provincia,comune,indirizzo,nomeAttivita, noteOperatore, gestoreAttuale, recapiti], function (err, rows, fields) {
					if(err){
						connection.rollback(function() {
						connection.release();
						//Failure
						});
						log.error('ERRORE SQL INSERT APPUNTAMENTO ' + err);
						res.sendStatus(500);
							
					}else{
						connection.commit(function(err) {
							if (err) {
								connection.rollback(function() {
								connection.release();
								//Failure
								});
								res.sendStatus(500);
							} else {
								connection.release();
								data["RESULT"] = "OK";
								res.json(data);
								//Success
							}
						});
					}
					
				});
			}
		});
	
		
	});
	}
});
});


app.post('/editDateAdmin', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
	} else {
	console.log("post :: /editDateAdmin");
	log.info('post Request :: /editDateAdmin');

	var data = {};
		var idAppuntamento = req.body.idAppuntamento;
		var dataAppuntamento = req.body.dataAppuntamento;
		var oraAppuntamento = req.body.oraAppuntamento;
		var provincia = req.body.provincia;
		var comune = req.body.comune;
		var indirizzo = req.body.indirizzo;
		var idOperatore = req.body.idOperatore;
		var idAgente = req.body.idAgente;
		var nomeAttivita = req.body.nomeAttivita;
		var gestoreAttuale = req.body.gestoreAttuale;
		var recapiti = req.body.recapiti;
		var noteOperatore = req.body.noteOperatore;
		var recapiti = req.body.recapiti;
		var esitoAppuntamento = req.body.esitoAppuntamento;
		var noteAgente = req.body.noteAgente;
		 //VERIFICARE SE SONO NULL O VUOTI COME LI GESTISCE VISTO CHE IL CAMPO è INT
		 var numLuce = req.body.numLuce;
		 var numGas = req.body.numGas;
		  //VERIFICARE SE SONO NULL O VUOTI COME LI GESTISCE VISTO CHE IL CAMPO è INT
		 var codici_contratto_luce = req.body.codici_contratto_luce ;
		 var codici_contratto_gas = req.body.codici_contratto_gas;
		

	pool.getConnection(function (err, connection) {
		connection.beginTransaction(function(errTrans) {
			if (errTrans) {                  //Transaction Error (Rollback and release connection)
				connection.rollback(function() {
				connection.release();
				});
				res.sendStatus(500);
			}else{
				connection.query('UPDATE APPUNTAMENTI SET DATA_APPUNTAMENTO = ?, ORA_APPUNTAMENTO = ?, '
				+' PROVINCIA = ?, COMUNE = ?, INDIRIZZO = ?, ID_OPERATORE = ?, ID_VENDITORE = ?, NOME_ATTIVITA = ?, NOTE_OPERATORE = ?, '
				+' ATTUALE_GESTORE = ?, RECAPITI = ?, ESITO = ?, NOTE_AGENTE = ?, '
				+' NUM_LUCE = ?, NUM_GAS = ?, CODICI_CONTRATTO_LUCE = ?, CODICI_CONTRATTO_GAS = ? '
				+'  WHERE ID_APPUNTAMENTO = ? ', [dataAppuntamento,oraAppuntamento,provincia,comune,indirizzo,idOperatore, idAgente,nomeAttivita,noteOperatore,gestoreAttuale,recapiti, esitoAppuntamento, noteAgente, numLuce, numGas, codici_contratto_luce, codici_contratto_gas  ,idAppuntamento], function (err, rows, fields) {
					if(err){
						connection.rollback(function() {
						connection.release();
						//Failure
						});
						log.error('ERRORE SQL editDateAdmin ' + err);
						res.sendStatus(500);
							
					}else{
						connection.commit(function(err) {
							if (err) {
								connection.rollback(function() {
								connection.release();
								//Failure
								});
								res.sendStatus(500);
							} else {
								connection.release();
								data["RESULT"] = "OK";
								res.json(data);
								//Success
							}
						});
					}
					
				});
			}
		});
	
		
	});
	}
});
});

// NUOVO APPUNTAMENTO
app.post('/editDateVenditore', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
	} else {
	console.log("post :: /editDateVenditore");
	log.info('post Request :: /editDateVenditore');

	var data = {};
	   var idAppuntamento = req.body.idAppuntamento;
	   var esitoAppuntamento = req.body.esitoAppuntamento;

	   //VERIFICARE SE SONO NULL O VUOTI COME LI GESTISCE VISTO CHE IL CAMPO è INT
	   var numLuce = req.body.numLuce;
	   var numGas = req.body.numGas;
	    //VERIFICARE SE SONO NULL O VUOTI COME LI GESTISCE VISTO CHE IL CAMPO è INT
	   var codici_contratto_luce = req.body.codici_contratto_luce ;
	   var codici_contratto_gas = req.body.codici_contratto_gas;
	   var noteAgente = req.body.noteAgente;

	pool.getConnection(function (err, connection) {
		connection.beginTransaction(function(errTrans) {
			if (errTrans) {                  //Transaction Error (Rollback and release connection)
				connection.rollback(function() {
				connection.release();
				});
				res.sendStatus(500);
			}else{
				connection.query('UPDATE APPUNTAMENTI SET ESITO = ?, NUM_LUCE = ?, NUM_GAS = ?, CODICI_CONTRATTO_LUCE = ?, CODICI_CONTRATTO_GAS = ?, NOTE_AGENTE = ? WHERE ID_APPUNTAMENTO = ?', [esitoAppuntamento, numLuce, numGas, codici_contratto_luce, codici_contratto_gas, noteAgente, idAppuntamento], function (err, rows, fields) {
					if(err){
						connection.rollback(function() {
						connection.release();
						//Failure
						});
						log.error('ERRORE SQL editDateVenditore ' + err);
						res.sendStatus(500);
							
					}else{
						connection.commit(function(err) {
							if (err) {
								connection.rollback(function() {
								connection.release();
								//Failure
								});
								res.sendStatus(500);
							} else {
								connection.release();
								data["RESULT"] = "OK";
								res.json(data);
								//Success
							}
						});
					}
					
				});
			}
		});
	
		
	});
	}
});
});
app.post('/editDateOperatore', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
	} else {
	console.log("post :: /editDateOperatore");
	log.info('post Request :: /editDateOperatore');

	var data = {};
		var idAppuntamento = req.body.idAppuntamento;
		var dataAppuntamento = req.body.dataAppuntamento;
		var oraAppuntamento = req.body.oraAppuntamento;
		var provincia = req.body.provincia;
		var comune = req.body.comune;
		var indirizzo = req.body.indirizzo;
		var idOperatore = req.body.idOperatore;
		var idAgente = req.body.idAgente;
		var nomeAttivita = req.body.nomeAttivita;
		var gestoreAttuale = req.body.gestoreAttuale;
		var recapiti = req.body.recapiti;
		var noteOperatore = req.body.noteOperatore;
		var recapiti = req.body.recapiti;
		var esitoAppuntamento = req.body.esitoAppuntamento;
		var noteAgente = req.body.noteAgente;

	pool.getConnection(function (err, connection) {
		connection.beginTransaction(function(errTrans) {
			if (errTrans) {                  //Transaction Error (Rollback and release connection)
				connection.rollback(function() {
				connection.release();
				});
				res.sendStatus(500);
			}else{
				connection.query('UPDATE APPUNTAMENTI SET DATA_APPUNTAMENTO = ?, ORA_APPUNTAMENTO = ?, '
				+' PROVINCIA = ?, COMUNE = ?, INDIRIZZO = ?, ID_OPERATORE = ?, ID_VENDITORE = ?, NOME_ATTIVITA = ?, NOTE_OPERATORE = ?, '
				+' ATTUALE_GESTORE = ?, RECAPITI = ?, ESITO = ?, NOTE_AGENTE = ? '
				+'  WHERE ID_APPUNTAMENTO = ? ', [dataAppuntamento,oraAppuntamento,provincia,comune,indirizzo,idOperatore, idAgente,nomeAttivita,noteOperatore,gestoreAttuale,recapiti, esitoAppuntamento, noteAgente  ,idAppuntamento], function (err, rows, fields) {
					if(err){
						connection.rollback(function() {
						connection.release();
						//Failure
						});
						log.error('ERRORE SQL editDateOperatore ' + err);
						res.sendStatus(500);
							
					}else{
						connection.commit(function(err) {
							if (err) {
								connection.rollback(function() {
								connection.release();
								//Failure
								});
								res.sendStatus(500);
							} else {
								connection.release();
								data["RESULT"] = "OK";
								res.json(data);
								//Success
							}
						});
					}
					
				});
			}
		});
	
		
	});
	}
});
});

//lsita appuntamenti admin
app.get('/listaAppuntamentiAdmin', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
			
		} else {
			
			var data = {};
			var today = new Date();
			var meseCorrente = today.getMonth()+1;
			var giornoCorrente = today.getDate();
			var annoCorrente = today.getFullYear();

			var from = "";
			var to = "";

			//aggiungo 3 giorni in piu alla data to per avere visibilità dei mesi
			if(giornoCorrente >= 15){
				from = annoCorrente+"-"+meseCorrente+"-"+"15";
				if(meseCorrente == 12){
					to = (annoCorrente+1)+"-01-"+"18";
				}else{
					to = annoCorrente+"-"+(meseCorrente+1)+"-"+"18";
				}
			}else{
				from = annoCorrente+"-"+(meseCorrente-1)+"-"+"15";
				to = annoCorrente+"-"+(meseCorrente)+"-"+"18";
			}


			pool.getConnection(function (err, connection) {
				connection.query(
				'SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,'+ 
				' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*'+
				' FROM APPUNTAMENTI'+
				' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE'+
				' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE'+
				' WHERE (DATA_APPUNTAMENTO >= ? AND DATA_APPUNTAMENTO <= ?)'+
				' OR ESITO = "VALUTA" OR ESITO = "ASSENTE" OR ESITO = "NON VISITATO" OR (ESITO IS NULL AND DATA_APPUNTAMENTO <= ?)' ,[from, to,to], function (err, rows, fields) {
					connection.release();
					if(err){
						log.error('ERRORE SQL LISTA APPUNTAMENTI ' + err);
						res.sendStatus(500);
					}else{
						if (rows.length !== 0) {
							data["appuntamenti"] = rows;
							res.json(data);
						} else if (rows.length === 0) {
							//Error code 2 = no rows in db.
							data["error"] = 2;
							data["appuntamenti"] = 'Nessun appuntamento trovato';
							res.json(data);
						} else {
							data["appuntamenti"] = 'Errore in fase di reperimento appuntamentI';
							res.status(500).json(data);
							console.log('Errore in fase di reperimento appuntamenti: ' + err);
							log.error('Errore in fase di reperimento appuntamenti: ' + err);
						}
					}
				
				});
			
			});
		  
		}
	});
});

//lsita appuntamenti venditore
app.get('/listaAppuntamentiVenditore/:id', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
			
		} else {
			var id=req.params.id;
			var data = {};
			var today = new Date();
			var meseCorrente = today.getMonth()+1;
			var giornoCorrente = today.getDate();
			var annoCorrente = today.getFullYear();

			var from = "";
			var to = "";

			if(giornoCorrente >= 15){
				from = annoCorrente+"-"+meseCorrente+"-"+"15";
				if(meseCorrente == 12){
					to = (annoCorrente+1)+"-01-"+"18";
				}else{
					to = annoCorrente+"-"+(meseCorrente+1)+"-"+"18";
				}
			}else{
				from = annoCorrente+"-"+(meseCorrente-1)+"-"+"15";
				to = annoCorrente+"-"+(meseCorrente)+"-"+"18";
			}


			pool.getConnection(function (err, connection) {
				connection.query(
				'SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,'+ 
				' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*'+
				' FROM APPUNTAMENTI'+
				' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE'+
				' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE'+
				' WHERE ((DATA_APPUNTAMENTO >= ? AND DATA_APPUNTAMENTO <= ?)'+
				' OR (ESITO = "VALUTA" OR ESITO = "ASSENTE" OR ESITO = "NON VISITATO" OR (ESITO IS NULL AND DATA_APPUNTAMENTO <= ?))) AND APPUNTAMENTI.ID_VENDITORE=?' ,[from, to, to,id], function (err, rows, fields) {
			
					connection.release();
					if(err){
						log.error('ERRORE SQL LISTA APPUNTAMENTI ' + err);
						res.sendStatus(500);
					}else{
						if (rows.length !== 0) {
							data["appuntamenti"] = rows;
							res.json(data);
						} else if (rows.length === 0) {
							//Error code 2 = no rows in db.
							data["error"] = 2;
							data["appuntamenti"] = 'Nessun appuntamento trovato';
							res.json(data);
						} else {
							data["appuntamenti"] = 'Errore in fase di reperimento appuntamentI';
							res.status(500).json(data);
							console.log('Errore in fase di reperimento appuntamenti: ' + err);
							log.error('Errore in fase di reperimento appuntamenti: ' + err);
						}
					}
				
				});
			
			});
		  
		}
	});
});

//lsita appuntamenti operatore
app.get('/listaAppuntamentiOperatore/:id', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
			
		} else {
			var id=req.params.id;
			var data = {};
			var today = new Date();
			var meseCorrente = today.getMonth()+1;
			var giornoCorrente = today.getDate();
			var annoCorrente = today.getFullYear();

			var from = "";
			var to = "";

			if(giornoCorrente >= 15){
				from = annoCorrente+"-"+meseCorrente+"-"+"15";
				if(meseCorrente == 12){
					to = (annoCorrente+1)+"-01-"+"18";
				}else{
					to = annoCorrente+"-"+(meseCorrente+1)+"-"+"18"
				}
			}else{
				from = annoCorrente+"-"+(meseCorrente-1)+"-"+"15";
				to = annoCorrente+"-"+(meseCorrente)+"-"+"18";
			}


			pool.getConnection(function (err, connection) {
				connection.query(
				'SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,'+ 
				' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*'+
				' FROM APPUNTAMENTI'+
				' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE'+
				' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE'+
				' WHERE ((DATA_APPUNTAMENTO >= ? AND DATA_APPUNTAMENTO <= ?)'+
				' OR (ESITO = "VALUTA" OR ESITO = "ASSENTE" OR ESITO = "NON VISITATO" OR (ESITO IS NULL AND DATA_APPUNTAMENTO <= ?))) AND APPUNTAMENTI.ID_OPERATORE = ?' ,[from, to,to, id], function (err, rows, fields) {
					connection.release();
					if(err){
						log.error('ERRORE SQL LISTA APPUNTAMENTI ' + err);
						res.sendStatus(500);
					}else{
						if (rows.length !== 0) {
							data["appuntamenti"] = rows;
							res.json(data);
						} else if (rows.length === 0) {
							//Error code 2 = no rows in db.
							data["error"] = 2;
							data["appuntamenti"] = 'Nessun appuntamento trovato';
							res.json(data);
						} else {
							data["appuntamenti"] = 'Errore in fase di reperimento appuntamentI';
							res.status(500).json(data);
							console.log('Errore in fase di reperimento appuntamenti: ' + err);
							log.error('Errore in fase di reperimento appuntamenti: ' + err);
						}
					}
				
				});
			
			});
		  
		}
	});
});

//lsita appuntamenti responsabile
app.get('/listaAppuntamentiResponsabile/:id', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
			
		} else {
			var id=req.params.id;
			var data = {};
			var today = new Date();
			var meseCorrente = today.getMonth()+1;
			var giornoCorrente = today.getDate();
			var annoCorrente = today.getFullYear();

			var from = "";
			var to = "";

			if(giornoCorrente >= 15){
				from = annoCorrente+"-"+meseCorrente+"-"+"15";
				if(meseCorrente == 12){
					to = (annoCorrente+1)+"-01-"+"18";
				}else{
					to = annoCorrente+"-"+(meseCorrente+1)+"-"+"18";
				}
			}else{
				from = annoCorrente+"-"+(meseCorrente-1)+"-"+"15";
				to = annoCorrente+"-"+(meseCorrente)+"-"+"18";
			}


			pool.getConnection(function (err, connection) {
				connection.query(
					' SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE, '+ 
					' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.* '+ 
					' FROM APPUNTAMENTI  '+ 
					' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE '+ 
				   ' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE '+ 
				   ' JOIN RESPONSABILI_AGENTI ON APPUNTAMENTI.ID_VENDITORE=RESPONSABILI_AGENTI.ID_AGENTE AND RESPONSABILI_AGENTI.ID_RESPONSABILE=? AND DATA_FINE_ASS IS NULL '+ 
					' WHERE  '+ 
					 ' ((DATA_APPUNTAMENTO >= ? AND DATA_APPUNTAMENTO <= ?) OR '+ 
				   ' (ESITO = "VALUTA" OR ESITO = "ASSENTE" OR ESITO = "NON VISITATO" '+ 
				   ' OR (ESITO IS NULL AND DATA_APPUNTAMENTO <= ?))) ',[id,from, to, to], function (err, rows, fields) {
			
					connection.release();
					if(err){
						log.error('ERRORE SQL LISTA APPUNTAMENTI ' + err);
						res.sendStatus(500);
					}else{
						if (rows.length !== 0) {
							data["appuntamenti"] = rows;
							res.json(data);
						} else if (rows.length === 0) {
							//Error code 2 = no rows in db.
							data["error"] = 2;
							data["appuntamenti"] = 'Nessun appuntamento trovato';
							res.json(data);
						} else {
							data["appuntamenti"] = 'Errore in fase di reperimento appuntamentI';
							res.status(500).json(data);
							console.log('Errore in fase di reperimento appuntamenti: ' + err);
							log.error('Errore in fase di reperimento appuntamenti: ' + err);
						}
					}
				
				});
			
			});
		  
		}
	});
});




//Cancellazione appuntamento
app.post('/deleteDate', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
			
		} else {
			var id= req.body.id;
			var data = {};
		


			pool.getConnection(function (err, connection) {
				connection.beginTransaction(function(errTrans) {
					if (errTrans) {                  //Transaction Error (Rollback and release connection)
						connection.rollback(function() {
						connection.release();
						});
						log.error('ERRORE SQL TRANSACTION CANCELLAZIONE APPUNTAMENTO ' + errTrans);
						res.sendStatus(500);
					}else{
						connection.query('DELETE FROM APPUNTAMENTI WHERE ID_APPUNTAMENTO= ?', [id], function (err, rows, fields) {
							if(err){
								connection.rollback(function() {
								connection.release();
								//Failure
								});
								log.error('ERRORE SQL CANCELLAZIONE APPUNTAMENTO ' + err);
								res.sendStatus(500);
									
							}else{
								connection.commit(function(err) {
									if (err) {
										connection.rollback(function() {
										connection.release();
										//Failure
										});
										res.sendStatus(500);
									} else {
										connection.release();
										data["RESULT"] = "OK";
										res.json(data);
										//Success
									}
								});
							}
							
						});
					}
				});
			
				
			});
		  
		}
	});
});












//Appuntamento
app.get('/appuntamento/:id', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
			
		} else {
			
			var data = {};
			
			var idAppuntamento = req.params.id;

			pool.getConnection(function (err, connection) {
				connection.query(
					'SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,'+ 
					' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*'+
					' FROM APPUNTAMENTI'+
					' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE'+
					' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE'+
					' WHERE APPUNTAMENTI.ID_APPUNTAMENTO = ?'  ,[idAppuntamento], function (err, rows, fields) {
					connection.release();
					if(err){
						log.error('ERRORE SQL GET APPUNTAMENTO: '+idAppuntamento+' --> ' + err);
						res.sendStatus(500);
					}else{
						if (rows.length !== 0) {
							data["appuntamento"] = rows[0];
							res.json(data);
						} else if (rows.length === 0) {
							//Error code 2 = no rows in db.
							data["error"] = 2;
							data["appuntamento"] = 'Nessun appuntamento trovato';
							res.status(404).json(data);
						} else {
							data["appuntamento"] = 'Errore in fase di reperimento appuntamento';
							res.status(500).json(data);
							console.log('Errore in fase di reperimento appuntamento: ' + err);
							log.error('Errore in fase di reperimento appuntamento: ' + err);
						}
					}
				
				});
			
			});
		  
		}
	});
});

//RICERCA APPUNTAMENTI GENERICA
app.post('/searchDate', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
		} else {
			var data = {};	
							
							var limit = req.body.limit;
							//piccolo ANTI HACK
							if(limit > 200){
								limit = 100;
							}

							var offset = req.body.offset;
			
							var dateFrom = req.body.dateFROM;
							var QdateFrom = " ";
							if(dateFrom !== '' && dateFrom !== undefined){
								QdateFrom = ' AND DATA_APPUNTAMENTO >= "'+dateFrom+'" ';
							}

							var dateTo = req.body.dateTO;
							var QdateTo = " ";
							if(dateTo !== '' && dateTo !== undefined){
								QdateTo = ' AND DATA_APPUNTAMENTO <= "'+dateTo+'" ';
							}

							var provincia = req.body.provincia;
							var Qprovincia = " ";
							if(provincia !== '' && provincia !== undefined){
								Qprovincia = ' AND PROVINCIA = "'+provincia+'" ';
							}

							var comune = req.body.comune;
							var Qcomune = " ";
							if(comune !== '' && comune !== undefined){
								Qcomune = ' AND COMUNE = "'+comune+'" ';
							}

							var esito = req.body.esito;
							var Qesito = " ";
							if(esito !== '' && esito !== undefined){
								Qesito = ' AND ESITO = "'+esito+'" ';
							}

							var codiceLuce = req.body.codiceLuce;
							var QcodiceLuce = " ";
							if(codiceLuce !== '' && codiceLuce !== undefined){
								QcodiceLuce = ' AND CODICI_CONTRATTO_LUCE LIKE "%'+codiceLuce+'%" ';
							}

							var codiceGas = req.body.codiceGas;
							var QcodiceGas = " ";
							if(codiceGas !== '' && codiceGas !== undefined){
								QcodiceGas = ' AND CODICI_CONTRATTO_GAS LIKE "%'+codiceGas+'%" ';
							}

							var agente = req.body.agente;
							var Qagente = " ";
							if(agente !== '' && agente !== undefined){
								Qagente = ' AND ID_VENDITORE = "'+agente+'" ';
							}

							var operatore = req.body.operatore;
							var Qoperatore = " ";
							if(operatore !== '' && operatore !== undefined){
								Qoperatore = ' AND ID_OPERATORE = "'+operatore+'" ';
							}


							pool.getConnection(function (err, connection) {
								connection.query('SELECT COUNT(*) AS TotalCount from APPUNTAMENTI WHERE 1=1 '+QdateFrom+QdateTo+Qprovincia+Qcomune+QcodiceLuce+QcodiceGas+Qagente+Qoperatore+Qesito+ ' ORDER BY DATA_APPUNTAMENTO', function (err, rows, fields) {
									connection.release();
									if(err){
										log.error('ERRORE SQL RICERCA COUNT APPUNTAMENTI ' + err);
										res.sendStatus(500);
									}else{

										data["totaleAppuntamenti"] = rows[0].TotalCount;

										pool.getConnection(function (err, connection) {
											connection.query(
												'SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,'+ 
												' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*'+
												' FROM APPUNTAMENTI'+
												' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE'+
												' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE'+
												' WHERE 1=1 '+QdateFrom+QdateTo+Qprovincia+Qcomune+QcodiceLuce+QcodiceGas+Qagente+Qoperatore+Qesito+ ' ORDER BY DATA_APPUNTAMENTO DESC LIMIT ? OFFSET ?'  ,[limit, offset], function (err, rows, fields) {
												connection.release();
												if(err){
													log.error('ERRORE SQL RICERCA APPUNTAMENTI: --> ' + err);
													res.sendStatus(500);
												}else{
													if (rows.length !== 0) {
														data["appuntamenti"] = rows;
														res.json(data);
													} 
													else{
														data["appuntamenti"] = [];
														res.json(data);
													}
												}
											
											});
										
										});
									}
								});
							});
								
		

						
		}
	});
});

//RICERCA APPUNTAMENTI RESPONSABILE AGENTI
app.post('/searchDateResponsabile', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
		} else {
			var data = {};	
							
							var limit = req.body.limit;
							//piccolo ANTI HACK
							if(limit > 200){
								limit = 100;
							}

							var offset = req.body.offset;
			
							var dateFrom = req.body.dateFROM;
							var QdateFrom = " ";
							if(dateFrom !== '' && dateFrom !== undefined){
								QdateFrom = ' AND DATA_APPUNTAMENTO >= "'+dateFrom+'" ';
							}

							var dateTo = req.body.dateTO;
							var QdateTo = " ";
							if(dateTo !== '' && dateTo !== undefined){
								QdateTo = ' AND DATA_APPUNTAMENTO <= "'+dateTo+'" ';
							}

							var provincia = req.body.provincia;
							var Qprovincia = " ";
							if(provincia !== '' && provincia !== undefined){
								Qprovincia = ' AND PROVINCIA = "'+provincia+'" ';
							}

							var comune = req.body.comune;
							var Qcomune = " ";
							if(comune !== '' && comune !== undefined){
								Qcomune = ' AND COMUNE = "'+comune+'" ';
							}

							var esito = req.body.esito;
							var Qesito = " ";
							if(esito !== '' && esito !== undefined){
								Qesito = ' AND ESITO = "'+esito+'" ';
							}

							var codiceLuce = req.body.codiceLuce;
							var QcodiceLuce = " ";
							if(codiceLuce !== '' && codiceLuce !== undefined){
								QcodiceLuce = ' AND CODICI_CONTRATTO_LUCE LIKE "%'+codiceLuce+'%" ';
							}

							var codiceGas = req.body.codiceGas;
							var QcodiceGas = " ";
							if(codiceGas !== '' && codiceGas !== undefined){
								QcodiceGas = ' AND CODICI_CONTRATTO_GAS LIKE "%'+codiceGas+'%" ';
							}

							var agente = req.body.agente;
							var Qagente = " ";
							if(agente !== '' && agente !== undefined){
								Qagente = ' AND ID_VENDITORE = "'+agente+'" ';
							}

							var idResponsabile = req.body.idResponsabile;
							

							pool.getConnection(function (err, connection) {
								connection.query('SELECT COUNT(*) AS TotalCount from APPUNTAMENTI '+
								' JOIN RESPONSABILI_AGENTI ON APPUNTAMENTI.ID_VENDITORE=RESPONSABILI_AGENTI.ID_AGENTE AND RESPONSABILI_AGENTI.ID_RESPONSABILE=? AND DATA_FINE_ASS IS NULL  WHERE 1=1 '+QdateFrom+QdateTo+Qprovincia+Qcomune+QcodiceLuce+QcodiceGas+Qagente+Qesito+ ' ORDER BY DATA_APPUNTAMENTO', [idResponsabile],  function (err, rows, fields) {
									connection.release();
									if(err){
										log.error('ERRORE SQL RICERCA COUNT APPUNTAMENTI ' + err);
										res.sendStatus(500);
									}else{

										data["totaleAppuntamenti"] = rows[0].TotalCount;

										pool.getConnection(function (err, connection) {
											connection.query(
												'SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,'+ 
												' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*'+
												' FROM APPUNTAMENTI'+
												' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE'+
												' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE'+
												' JOIN RESPONSABILI_AGENTI ON APPUNTAMENTI.ID_VENDITORE=RESPONSABILI_AGENTI.ID_AGENTE AND RESPONSABILI_AGENTI.ID_RESPONSABILE=? AND DATA_FINE_ASS IS NULL '+
												' WHERE 1=1 '+QdateFrom+QdateTo+Qprovincia+Qcomune+QcodiceLuce+QcodiceGas+Qagente+Qesito+ ' ORDER BY DATA_APPUNTAMENTO DESC LIMIT ? OFFSET ?'  ,[idResponsabile,limit, offset], function (err, rows, fields) {
												connection.release();
												if(err){
													log.error('ERRORE SQL RICERCA APPUNTAMENTI: --> ' + err);
													res.sendStatus(500);
												}else{
													if (rows.length !== 0) {
														data["appuntamenti"] = rows;
														res.json(data);
													} 
													else{
														data["appuntamenti"] = [];
														res.json(data);
													}
												}
											
											});
										
										});
									}
								});
							});
								
		

						
		}
	});
});

	
app.get('/listaUtentiForOperatore/:id', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
		} else {
			var idOperatore = req.params.id;
			var data = {};
			pool.getConnection(function (err, connection) {
				connection.query(  
					'SELECT * FROM UTENTI AS UT '
						+' JOIN '
						+' (SELECT * FROM OPERATORI_VENDITORI AS OP WHERE OP.ID_OPERATORE = ? AND OP.DATA_FINE_ASS IS NULL ) AS T ON UT.ID_UTENTE=T.ID_AGENTE WHERE UT.UTENTE_ATTIVO = 1' ,[idOperatore], function (err, rows, fields) {
					connection.release();
					if (rows.length !== 0 && !err) {
						data["utenti"] = rows;
						res.json(data);
					} else if (rows.length === 0) {
						//Error code 2 = no rows in db.
						data["error"] = 2;
						data["utenti"] = 'Nessun utente trovato';
						res.status(404).json(data);
					} else {
						data["utenti"] = 'Errore in fase di reperimento utente';
						res.status(500).json(data);
						console.log('Errore in fase di reperimento utenti: ' + err);
						log.error('Errore in fase di reperimento utenti: ' + err);
					}
				});
			
			});
		  
		}
	});
});

app.get('/listaAgentiForResponsabile/:id', ensureToken, function (req, res) {
	jwt.verify(req.token, config.secretKey, function(err, data) {
		if (err) {
			res.sendStatus(403); 
		} else {
			var idResponsabile = req.params.id;
			var data = {};
			pool.getConnection(function (err, connection) {
				connection.query(  
					'SELECT * FROM UTENTI AS UT '
						+' JOIN '
						+' (SELECT * FROM RESPONSABILI_AGENTI AS RA WHERE RA.ID_RESPONSABILE = ? AND RA.DATA_FINE_ASS IS NULL ) AS T ON UT.ID_UTENTE=T.ID_AGENTE WHERE UT.UTENTE_ATTIVO = 1' ,[idResponsabile], function (err, rows, fields) {
					connection.release();
					if (rows.length !== 0 && !err) {
						data["utenti"] = rows;
						res.json(data);
					} else if (rows.length === 0) {
						//Error code 2 = no rows in db.
						data["error"] = 2;
						data["utenti"] = 'Nessun utente trovato';
						res.json(data);
					} else {
						data["utenti"] = 'Errore in fase di reperimento utente';
						res.status(500).json(data);
						console.log('Errore in fase di reperimento utenti: ' + err);
						log.error('Errore in fase di reperimento utenti: ' + err);
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
				connection.query('SELECT * from UTENTI where TIPO = "RESPONSABILE_AGENTI" AND UTENTE_ATTIVO = 1' , function (err, rows, fields) {
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


var server = app.listen(8080, function () {

  var host = server.address().address;
  var port = server.address().port;
  var env = process.env.NODE_ENV || 'development';
  console.log("dummy app listening at: " + host + ":" + port + " " +env);

})