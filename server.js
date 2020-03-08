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
const helmet = require('helmet')
const router= require('./routes/index');

/*
app.listen(3000,'192.168.1.187' || 'localhost',function() {
    console.log('Application worker  started...');
  }
  );*/


//sicurezza web
app.use(helmet());

const fiveHour = 18000000;
//STATIC FILES
app.use(express.static(__dirname + '/public', {
    maxAge: fiveHour
}));


//app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
    limit: '10mb',
    extended: true
})) // Body parser use JSON data
app.use(bodyParser.urlencoded({
    extended: true
}));

// init refactoring

app.use('/api/v1', router);

/*MY SQL Connection Info*/
var pool = mysql.createPool({
    connectionLimit: config.connLimit,
    host: config.DbHost,
    user: config.DbUser,
    password: config.DbPassword,
    database: config.DbName,
    port: config.DbPort
});

const mysqldump = require('mysqldump');

var cron = require('node-cron');

cron.schedule('0 5 * * *', () => {
    // dump the result straight to a file
    mysqldump({
        connection: {
            host: config.DbHost,
            user: config.DbUser,
            password: config.DbPassword,
            database: config.DbName,
        },
        dumpToFile: './BackUpMysqlDbDump.sql',
    });
    //console.log('Runing a job at 07:00 at Europe/Rome timezone');

}, {
    scheduled: true,
    timezone: "Europe/Rome"
});


// This responds a POST request for the /LOGIN page.
app.post('/login', function (req, res) {
    console.log("post :: /login");
    log.info('post Request :: /login');

    var data = {};

    var username = req.body.username;
    var password = sha1(req.body.password);

    pool.getConnection(function (err, connection) {
        connection.query('SELECT * from UTENTI where USERNAME = ? and PASSWORD = ? and UTENTE_ATTIVO = 1', [username, password], function (err, rows, fields) {
            connection.release();
            if (rows.length !== 0 && !err) {
                data["utente"] = rows[0];

                var token;
                if (rows[0].TIPO == 'ADMIN') {
                    token = jwt.sign({
                        user: rows[0].ID_UTENTE,
                        role: 'ADMIN'
                    }, config.secretKey, {
                        expiresIn: "8h"
                    });
                }
                else if (rows[0].TIPO == 'BACK_OFFICE') {
                    token = jwt.sign({
                        user: rows[0].ID_UTENTE,
                        role: 'BACK_OFFICE'
                    }, config.secretKey, {
                        expiresIn: "8h"
                    });
                }
                else if (rows[0].TIPO == 'RESPONSABILE_AGENTI') {
                    token = jwt.sign({
                        user: rows[0].ID_UTENTE,
                        role: 'RESPONSABILE_AGENTI'
                    }, config.secretKey, {
                        expiresIn: "8h"
                    });
                }
                else {
                    token = jwt.sign({
                        user: rows[0].ID_UTENTE,
                        role: 'OTHER'
                    }, config.secretKey, {
                        expiresIn: "8h"
                    });
                }

                data["token"] = token;
                if (rows[0].EDIT_PASSWORD == 1) {
                    data["editPassword"] = "1";
                } else {
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
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            console.log("post :: /editPassword");
            log.info('post Request :: /editPassword');

            var data = {};

            var id = parseInt(req.body.userId);
            var password = sha1(req.body.password);

            pool.getConnection(function (err, connection) {
                connection.beginTransaction(function (errTrans) {
                    if (errTrans) { //Transaction Error (Rollback and release connection)
                        connection.rollback(function () {
                            connection.release();
                        });
                        res.sendStatus(500);
                    } else {
                        connection.query('UPDATE UTENTI SET PASSWORD=?, EDIT_PASSWORD=0 WHERE ID_UTENTE= ?', [password, id], function (err, rows, fields) {
                            if (err) {
                                connection.rollback(function () {
                                    connection.release();
                                    //Failure
                                });
                                log.error('ERRORE SQL UPDATE password UTENTE: ' + err);
                                //errore username duplicato

                                res.sendStatus(500);

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
app.post('/addUser', ensureToken, requireAdminOrResponsabile, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
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
            var supervisoreAssociato = req.body.supervisoreAssociato;

            pool.getConnection(function (err, connection) {
                connection.beginTransaction(function (errTrans) {
                    if (errTrans) { //Transaction Error (Rollback and release connection)
                        connection.rollback(function () {
                            connection.release();
                        });
                        res.sendStatus(500);
                    } else {
                        connection.query('INSERT INTO UTENTI (ID_UTENTE, NOME, COGNOME, TIPO, USERNAME, PASSWORD)VALUES (NULL, ?, ?, ?, ?, ?)', [nome, cognome, userType, username, password], function (err, rows, fields) {
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
                                // se l'usertype è l'operatore o BACK_OFFICE faccio il commit ed esco
                                if (userType === 'OPERATORE' || userType === 'BACK_OFFICE') {
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
                                    });
                                } else if (userType === 'RESPONSABILE_AGENTI') {
                                    var insertedId = rows.insertId;
                                    connection.query('INSERT INTO OPERATORI_VENDITORI (ID_ASSOCIAZIONE, ID_AGENTE, ID_OPERATORE, DATA_INIZIO_ASS, DATA_FINE_ASS)VALUES (NULL, ?, ?, CURDATE(), NULL)', [insertedId, operatoreAssociato], function (err, rows, fields) {
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
                                            if (supervisoreAssociato) {
                                                connection.query('INSERT INTO SUPERVISORE_RESPONSABILI (ID_ASSOCIAZIONE, ID_SUPERVISORE, ID_RESPONSABILE, DATA_INIZIO_ASS, DATA_FINE_ASS)VALUES (NULL, ?, ?, CURDATE(), NULL)', [supervisoreAssociato, insertedId], function (err, rows, fields) {
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

                                                    }
                                                });
                                            }

                                        }
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
                                        });
                                    });
                                } else if (userType === 'AGENTE' || userType === 'AGENTE_JUNIOR') {
                                    var insertedId = rows.insertId;
                                    if (operatoreAssociato) {

                                        connection.query('INSERT INTO OPERATORI_VENDITORI (ID_ASSOCIAZIONE, ID_AGENTE, ID_OPERATORE, DATA_INIZIO_ASS, DATA_FINE_ASS)VALUES (NULL, ?, ?, CURDATE(), NULL)', [insertedId, operatoreAssociato], function (err, rows, fields) {
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

                                            }
                                        });
                                    }
                                    if (responsabileAssociato) {
                                        connection.query('INSERT INTO RESPONSABILI_AGENTI (ID_ASSOCIAZIONE, ID_RESPONSABILE, ID_AGENTE, DATA_INIZIO_ASS, DATA_FINE_ASS)VALUES (NULL, ?, ?, CURDATE(), NULL)', [responsabileAssociato, insertedId], function (err, rows, fields) {
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

                                            }
                                        });
                                    }
                                    connection.commit(function (err) {
                                        if (err) {
                                            connection.rollback(function () {
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
app.post('/updateUser', ensureToken, requireAdmin, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            console.log("post :: /updateUser");
            log.info('post Request :: /updateUser');

            var data = {};
            var userId = req.body.userId;
            var username = req.body.username;
            var password = "";
            if (req.body.password !== '') {
                password = sha1(req.body.password);
            }
            var nome = req.body.nome;
            var cognome = req.body.cognome;
            var userType = req.body.userType;

            pool.getConnection(function (err, connection) {
                connection.beginTransaction(function (errTrans) {
                    if (errTrans) { //Transaction Error (Rollback and release connection)
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
                        } else {
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
app.post('/updateOperatore', ensureToken, requireAdmin, function (req, res) {
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
                    if (errTrans) { //Transaction Error (Rollback and release connection)
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
app.post('/updateResponsabile', ensureToken, requireAdmin, function (req, res) {
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
                    if (errTrans) { //Transaction Error (Rollback and release connection)
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
//UPDATE SUPERVISORE
app.post('/updateSupervisore', ensureToken, requireAdmin, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            console.log("post :: /updateSupervisore");
            log.info('post Request :: /updateSupervisore');

            var data = {};
            var userId = req.body.userId;
            var oldSupervisore = req.body.oldSupervisore;
            var newSupervisore = req.body.newSupervisore;

            pool.getConnection(function (err, connection) {
                connection.beginTransaction(function (errTrans) {
                    if (errTrans) { //Transaction Error (Rollback and release connection)
                        connection.rollback(function () {
                            connection.release();
                        });
                        res.sendStatus(500);
                    } else {
                        if (oldSupervisore != null) {
                            connection.query('UPDATE SUPERVISORE_RESPONSABILI SET  DATA_FINE_ASS=sysdate()  WHERE ID_RESPONSABILE=? and ID_SUPERVISORE=? and  DATA_FINE_ASS is null', [userId, oldSupervisore], function (err, rows, fields) {
                                if (err) {
                                    connection.rollback(function () {
                                        connection.release();
                                        //Failure
                                    });
                                    log.error('ERRORE SQL UPDATE SUPERVISORE_RESPONSABILI: ' + err);
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
                        if (newSupervisore != null) {
                            connection.query('INSERT INTO SUPERVISORE_RESPONSABILI (ID_RESPONSABILE, ID_SUPERVISORE, DATA_INIZIO_ASS, DATA_FINE_ASS) VALUES(?,?,SYSDATE(), null) ', [userId, newSupervisore], function (err, rows, fields) {
                                if (err) {
                                    connection.rollback(function () {
                                        connection.release();
                                        //Failure
                                    });
                                    log.error('ERRORE SQL INSERT INTO SUPERVISORE_RESPONSABILI : ' + err);
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
app.post('/deleteUser', ensureToken, requireAdmin, function (req, res) {
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
                    if (errTrans) { //Transaction Error (Rollback and release connection)
                        connection.rollback(function () {
                            connection.release();
                        });
                        res.sendStatus(500);
                    } else {
                        var querystring = '';
                        var params = [];
                        queryString = 'UPDATE UTENTI SET  UTENTE_ATTIVO=0 WHERE ID_UTENTE=?';
                        params = [userId]


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
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);

        } else {
            var data = {};
            pool.getConnection(function (err, connection) {
                connection.query('SELECT * from UTENTI where TIPO = "OPERATORE" AND UTENTE_ATTIVO = 1 ORDER BY COGNOME ASC', function (err, rows, fields) {
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
//lsita Agenti ATTIVI e non relazionati agli operatori 
app.get('/listaAgentiNoRelationWithOperatorWS', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);

        } else {
            var data = {};
            pool.getConnection(function (err, connection) {
                connection.query('SELECT * from UTENTI where (TIPO = "AGENTE" OR TIPO = "RESPONSABILE_AGENTI") AND UTENTE_ATTIVO = 1 ORDER BY COGNOME ASC', function (err, rows, fields) {
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

//lsita Agenti ATTIVI e non relazionati agli operatori RECESSI
app.get('/listaAgentiNoRelationWithOperatorWSrecessi', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);

        } else {
            var data = {};
            pool.getConnection(function (err, connection) {
                connection.query('SELECT * from UTENTI where (TIPO = "AGENTE" OR TIPO = "RESPONSABILE_AGENTI" OR TIPO="AGENTE_JUNIOR") AND UTENTE_ATTIVO = 1 ORDER BY COGNOME ASC', function (err, rows, fields) {
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
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);

        } else {
            var data = {};
            pool.getConnection(function (err, connection) {
                connection.query('SELECT * from UTENTI where (TIPO = "AGENTE" OR TIPO = "RESPONSABILE_AGENTI") ORDER BY COGNOME ASC', function (err, rows, fields) {
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
app.get('/listaAgentiNoRelationWithOperatorAndUserDeletedWSrecessi', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);

        } else {
            var data = {};
            pool.getConnection(function (err, connection) {
                connection.query('SELECT * from UTENTI where (TIPO = "AGENTE" OR TIPO = "RESPONSABILE_AGENTI" OR TIPO = "AGENTE_JUNIOR") ORDER BY COGNOME ASC', function (err, rows, fields) {
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
app.get('/listaUtenti', ensureToken, requireAdmin, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);

        } else {
            var data = {};
            pool.getConnection(function (err, connection) {
                connection.query('SELECT * from UTENTI WHERE UTENTE_ATTIVO=1 ORDER BY COGNOME ASC', function (err, rows, fields) {
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
app.get('/edituser/:id', ensureToken, requireAdmin, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);

        } else {
            var id = req.params.id;

            pool.getConnection(function (err, connection) {
                connection.query(
                    `SELECT UTENTI.*,
					 OV.ID_ASSOCIAZIONE as OV_ID_ASSOCIAZIONE,
					 OV.ID_OPERATORE as OV_ID_OPERATORE,
					 OV.ID_AGENTE as OV_ID_AGENTE,  
					 OV.DATA_INIZIO_ASS as OV_DATA_INIO_ASS,
					 OV.DATA_FINE_ASS as OV_DATA_FINE_ASS,
					 RA.ID_ASSOCIAZIONE as RA_ID_ASSOCIAZIONE,
					 RA.ID_RESPONSABILE as RA_ID_RESPONSABILE,
					 RA.ID_AGENTE as RA_ID_AGENTE,  
					 RA.DATA_INIZIO_ASS as RA_DATA_INIO_ASS,
					 RA.DATA_FINE_ASS as RA_DATA_FINE_ASS,
					 SR.ID_ASSOCIAZIONE as SR_ID_ASSOCIAZIONE,
					 SR.ID_RESPONSABILE as SR_ID_RESPONSABILE,
					 SR.ID_SUPERVISORE as SR_ID_SUPERVISORE,  
					 SR.DATA_INIZIO_ASS as SR_DATA_INIO_ASS,
					 SR.DATA_FINE_ASS as SR_DATA_FINE_ASS 
					
					FROM UTENTI
					
					LEFT JOIN OPERATORI_VENDITORI OV ON TIPO<>"OPERATORE" AND OV.ID_AGENTE=UTENTI.ID_UTENTE AND OV.DATA_FINE_ASS IS NULL 
					LEFT JOIN RESPONSABILI_AGENTI RA ON TIPO="AGENTE" OR TIPO="AGENTE_JUNIOR" AND RA.ID_AGENTE=UTENTI.ID_UTENTE AND RA.DATA_FINE_ASS IS NULL 
					LEFT JOIN SUPERVISORE_RESPONSABILI SR ON TIPO="RESPONSABILE_AGENTI" AND SR.ID_RESPONSABILE=UTENTI.ID_UTENTE AND SR.DATA_FINE_ASS IS NULL  
					WHERE ID_UTENTE=?`, id,
                    function (err, rows, fields) {

                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL MODIFICA UTENTE ' + err);
                            res.sendStatus(500);
                        } else {
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
    jwt.verify(req.token, config.secretKey, function (err, data) {
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
                connection.beginTransaction(function (errTrans) {
                    if (errTrans) { //Transaction Error (Rollback and release connection)
                        connection.rollback(function () {
                            connection.release();
                        });
                        res.sendStatus(500);
                    } else {
                        connection.query('INSERT INTO APPUNTAMENTI' +
                            '(ID_APPUNTAMENTO, ID_OPERATORE, ID_VENDITORE, DATA_CREAZIONE, DATA_APPUNTAMENTO, ORA_APPUNTAMENTO, PROVINCIA, COMUNE, INDIRIZZO, NOME_ATTIVITA, NOTE_OPERATORE, ATTUALE_GESTORE, RECAPITI)' +
                            'VALUES (NULL, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?  )', [idOperatore, idAgente, dataAppuntamento, oraAppuntamento, provincia, comune, indirizzo, nomeAttivita, noteOperatore, gestoreAttuale, recapiti],
                            function (err, rows, fields) {
                                if (err) {
                                    connection.rollback(function () {
                                        connection.release();
                                        //Failure
                                    });
                                    log.error('ERRORE SQL INSERT APPUNTAMENTO ' + err);
                                    res.sendStatus(500);

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
                                    });
                                }

                            });
                    }
                });


            });
        }
    });
});


app.post('/editDateAdmin', ensureToken, requireAdmin, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
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
            if (esitoAppuntamento && !esitoAppuntamento.trim()) {
                esitoAppuntamento = null;
            }
            var noteAgente = req.body.noteAgente;
            //VERIFICARE SE SONO NULL O VUOTI COME LI GESTISCE VISTO CHE IL CAMPO è INT
            var numLuce = req.body.numLuce;
            var numGas = req.body.numGas;
            //VERIFICARE SE SONO NULL O VUOTI COME LI GESTISCE VISTO CHE IL CAMPO è INT
            var codici_contratto_luce = req.body.codici_contratto_luce;
            var codici_contratto_gas = req.body.codici_contratto_gas;
            var date_ok = null;
            // SE LO STATO PRECEDENTE NON ERA OK E LO STATO ATTUALE E' OK ALLORA SETTO LA DATA DI CHIUSURA
            if (req.body.data_ok == 'OK') {
                var today = new Date();
                var meseCorrente = today.getMonth() + 1;
                var giornoCorrenteMenoUno = today.getDate();
                var annoCorrente = today.getFullYear();
                var date_ok = annoCorrente + "-" + meseCorrente + "-" + giornoCorrenteMenoUno;
            }


            pool.getConnection(function (err, connection) {
                connection.beginTransaction(function (errTrans) {
                    if (errTrans) { //Transaction Error (Rollback and release connection)
                        connection.rollback(function () {
                            connection.release();
                        });
                        res.sendStatus(500);
                    } else {
                        connection.query('UPDATE APPUNTAMENTI SET DATA_APPUNTAMENTO = ?, ORA_APPUNTAMENTO = ?, ' +
                            ' PROVINCIA = ?, COMUNE = ?, INDIRIZZO = ?, ID_OPERATORE = ?, ID_VENDITORE = ?, NOME_ATTIVITA = ?, NOTE_OPERATORE = ?, ' +
                            ' ATTUALE_GESTORE = ?, RECAPITI = ?, ESITO = ?, NOTE_AGENTE = ?, ' +
                            ' NUM_LUCE = ?, NUM_GAS = ?, CODICI_CONTRATTO_LUCE = ?, CODICI_CONTRATTO_GAS = ?, DATA_OK = ? ' +
                            '  WHERE ID_APPUNTAMENTO = ? ', [dataAppuntamento, oraAppuntamento, provincia, comune, indirizzo, idOperatore, idAgente, nomeAttivita, noteOperatore, gestoreAttuale, recapiti, esitoAppuntamento, noteAgente, numLuce, numGas, codici_contratto_luce, codici_contratto_gas, date_ok, idAppuntamento],
                            function (err, rows, fields) {
                                if (err) {
                                    connection.rollback(function () {
                                        connection.release();
                                        //Failure
                                    });
                                    log.error('ERRORE SQL editDateAdmin ' + err);
                                    res.sendStatus(500);

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
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            console.log("post :: /editDateVenditore");
            log.info('post Request :: /editDateVenditore');

            var data = {};
            var idAppuntamento = req.body.idAppuntamento;
            var esitoAppuntamento = req.body.esitoAppuntamento;
            if (esitoAppuntamento && !esitoAppuntamento.trim()) {
                esitoAppuntamento = null;
            }
            //VERIFICARE SE SONO NULL O VUOTI COME LI GESTISCE VISTO CHE IL CAMPO è INT
            var numLuce = req.body.numLuce;
            var numGas = req.body.numGas;
            //VERIFICARE SE SONO NULL O VUOTI COME LI GESTISCE VISTO CHE IL CAMPO è INT
            var codici_contratto_luce = req.body.codici_contratto_luce;
            var codici_contratto_gas = req.body.codici_contratto_gas;
            var noteAgente = req.body.noteAgente;
            var date_ok = null;
            // SE LO STATO PRECEDENTE NON ERA OK E LO STATO ATTUALE E' OK ALLORA SETTO LA DATA DI CHIUSURA
            if (req.body.data_ok == 'OK') {
                var today = new Date();
                var meseCorrente = today.getMonth() + 1;
                var giornoCorrenteMenoUno = today.getDate();
                var annoCorrente = today.getFullYear();
                var date_ok = annoCorrente + "-" + meseCorrente + "-" + giornoCorrenteMenoUno;
            }

            pool.getConnection(function (err, connection) {
                connection.beginTransaction(function (errTrans) {
                    if (errTrans) { //Transaction Error (Rollback and release connection)
                        connection.rollback(function () {
                            connection.release();
                        });
                        res.sendStatus(500);
                    } else {
                        connection.query('UPDATE APPUNTAMENTI SET ESITO = ?, NUM_LUCE = ?, NUM_GAS = ?, CODICI_CONTRATTO_LUCE = ?, CODICI_CONTRATTO_GAS = ?, NOTE_AGENTE = ?, DATA_OK = ? WHERE ID_APPUNTAMENTO = ?', [esitoAppuntamento, numLuce, numGas, codici_contratto_luce, codici_contratto_gas, noteAgente, date_ok, idAppuntamento], function (err, rows, fields) {
                            if (err) {
                                connection.rollback(function () {
                                    connection.release();
                                    //Failure
                                });
                                log.error('ERRORE SQL editDateVenditore ' + err);
                                res.sendStatus(500);

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
    jwt.verify(req.token, config.secretKey, function (err, data) {
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
            if (esitoAppuntamento && !esitoAppuntamento.trim()) {
                esitoAppuntamento = null;
            }
            var noteAgente = req.body.noteAgente;

            pool.getConnection(function (err, connection) {
                connection.beginTransaction(function (errTrans) {
                    if (errTrans) { //Transaction Error (Rollback and release connection)
                        connection.rollback(function () {
                            connection.release();
                        });
                        res.sendStatus(500);
                    } else {
                        connection.query('UPDATE APPUNTAMENTI SET DATA_APPUNTAMENTO = ?, ORA_APPUNTAMENTO = ?, ' +
                            ' PROVINCIA = ?, COMUNE = ?, INDIRIZZO = ?, ID_OPERATORE = ?, ID_VENDITORE = ?, NOME_ATTIVITA = ?, NOTE_OPERATORE = ?, ' +
                            ' ATTUALE_GESTORE = ?, RECAPITI = ?, ESITO = ?, NOTE_AGENTE = ? ' +
                            '  WHERE ID_APPUNTAMENTO = ? ', [dataAppuntamento, oraAppuntamento, provincia, comune, indirizzo, idOperatore, idAgente, nomeAttivita, noteOperatore, gestoreAttuale, recapiti, esitoAppuntamento, noteAgente, idAppuntamento],
                            function (err, rows, fields) {
                                if (err) {
                                    connection.rollback(function () {
                                        connection.release();
                                        //Failure
                                    });
                                    log.error('ERRORE SQL editDateOperatore ' + err);
                                    res.sendStatus(500);

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
app.get('/listaAppuntamentiAdmin', ensureToken, requireAdminOrBackOffice, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);

        } else {

            var data = {};
            var today = new Date();
            var meseCorrente = today.getMonth() + 1;
            var giornoCorrente = today.getDate();
            var annoCorrente = today.getFullYear();

            var from = "";
            var to = "";

            //aggiungo 3 giorni in piu alla data to per avere visibilità dei mesi
            if (giornoCorrente >= 15) {
                from = annoCorrente + "-" + meseCorrente + "-" + "15";
                if (meseCorrente == 12) {
                    to = (annoCorrente + 1) + "-01-" + "18";
                } else {
                    to = annoCorrente + "-" + (meseCorrente + 1) + "-" + "18";
                }
            } else {
                from = annoCorrente + "-" + (meseCorrente - 1) + "-" + "15";
                to = annoCorrente + "-" + (meseCorrente) + "-" + "18";
            }


            pool.getConnection(function (err, connection) {
                connection.query(
                    'SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,' +
                    ' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*' +
                    ' FROM APPUNTAMENTI' +
                    ' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE' +
                    ' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE' +
                    ' WHERE (DATA_APPUNTAMENTO >= ? AND DATA_APPUNTAMENTO <= ?)' +
                    ' OR ESITO = "VALUTA" OR ESITO = "ASSENTE" OR ESITO = "NON VISITATO" OR (ESITO IS NULL AND DATA_APPUNTAMENTO <= ?)', [from, to, to],
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL LISTA APPUNTAMENTI ' + err);
                            res.sendStatus(500);
                        } else {
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
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);

        } else {
            var id = req.params.id;
            var data = {};
            var today = new Date();
            var meseCorrente = today.getMonth() + 1;
            var giornoCorrente = today.getDate();
            var annoCorrente = today.getFullYear();

            var from = "";
            var to = "";

            if (giornoCorrente >= 15) {
                from = annoCorrente + "-" + meseCorrente + "-" + "15";
                if (meseCorrente == 12) {
                    to = (annoCorrente + 1) + "-01-" + "18";
                } else {
                    to = annoCorrente + "-" + (meseCorrente + 1) + "-" + "18";
                }
            } else {
                from = annoCorrente + "-" + (meseCorrente - 1) + "-" + "15";
                to = annoCorrente + "-" + (meseCorrente) + "-" + "18";
            }


            pool.getConnection(function (err, connection) {
                connection.query(
                    'SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,' +
                    ' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*' +
                    ' FROM APPUNTAMENTI' +
                    ' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE' +
                    ' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE' +
                    ' WHERE ((DATA_APPUNTAMENTO >= ? AND DATA_APPUNTAMENTO <= ?)' +
                    ' OR (ESITO = "VALUTA" OR ESITO = "ASSENTE" OR ESITO = "NON VISITATO" OR (ESITO IS NULL AND DATA_APPUNTAMENTO <= ?))) AND APPUNTAMENTI.ID_VENDITORE=?', [from, to, to, id],
                    function (err, rows, fields) {

                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL LISTA APPUNTAMENTI ' + err);
                            res.sendStatus(500);
                        } else {
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
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);

        } else {
            var id = req.params.id;
            var data = {};
            var today = new Date();
            var meseCorrente = today.getMonth() + 1;
            var giornoCorrente = today.getDate();
            var annoCorrente = today.getFullYear();

            var from = "";
            var to = "";

            if (giornoCorrente >= 15) {
                from = annoCorrente + "-" + meseCorrente + "-" + "15";
                if (meseCorrente == 12) {
                    to = (annoCorrente + 1) + "-01-" + "18";
                } else {
                    to = annoCorrente + "-" + (meseCorrente + 1) + "-" + "18"
                }
            } else {
                from = annoCorrente + "-" + (meseCorrente - 1) + "-" + "15";
                to = annoCorrente + "-" + (meseCorrente) + "-" + "18";
            }


            pool.getConnection(function (err, connection) {
                connection.query(
                    'SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,' +
                    ' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*' +
                    ' FROM APPUNTAMENTI' +
                    ' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE' +
                    ' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE' +
                    ' WHERE ((DATA_APPUNTAMENTO >= ? AND DATA_APPUNTAMENTO <= ?)' +
                    ' OR (ESITO = "VALUTA" OR ESITO = "ASSENTE" OR ESITO = "NON VISITATO" OR (ESITO IS NULL AND DATA_APPUNTAMENTO <= ?))) AND APPUNTAMENTI.ID_OPERATORE = ?', [from, to, to, id],
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL LISTA APPUNTAMENTI ' + err);
                            res.sendStatus(500);
                        } else {
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
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);

        } else {
            var id = req.params.id;
            var data = {};
            var today = new Date();
            var meseCorrente = today.getMonth() + 1;
            var giornoCorrente = today.getDate();
            var annoCorrente = today.getFullYear();

            var from = "";
            var to = "";

            if (giornoCorrente >= 15) {
                from = annoCorrente + "-" + meseCorrente + "-" + "15";
                if (meseCorrente == 12) {
                    to = (annoCorrente + 1) + "-01-" + "18";
                } else {
                    to = annoCorrente + "-" + (meseCorrente + 1) + "-" + "18";
                }
            } else {
                from = annoCorrente + "-" + (meseCorrente - 1) + "-" + "15";
                to = annoCorrente + "-" + (meseCorrente) + "-" + "18";
            }


            pool.getConnection(function (err, connection) {
                connection.query(
                    ` SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,  
					VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*  
					FROM APPUNTAMENTI   
					LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE  
				   LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE  
				   JOIN RESPONSABILI_AGENTI ON APPUNTAMENTI.ID_VENDITORE=RESPONSABILI_AGENTI.ID_AGENTE AND RESPONSABILI_AGENTI.ID_RESPONSABILE=? AND RESPONSABILI_AGENTI.DATA_FINE_ASS IS NULL  
					WHERE   
					 ((DATA_APPUNTAMENTO >= ? AND DATA_APPUNTAMENTO <= ?) OR  
				   (ESITO = "VALUTA" OR ESITO = "ASSENTE" OR ESITO = "NON VISITATO"  
				   OR (ESITO IS NULL AND DATA_APPUNTAMENTO <= ?))) 
		   
				   
				   UNION
				   
			SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,  
					VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*  
					FROM APPUNTAMENTI   
					LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE  
				   LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE 
					JOIN RESPONSABILI_AGENTI ON APPUNTAMENTI.ID_VENDITORE=RESPONSABILI_AGENTI.ID_AGENTE  AND RESPONSABILI_AGENTI.DATA_FINE_ASS IS NULL   
				   JOIN  SUPERVISORE_RESPONSABILI ON RESPONSABILI_AGENTI.ID_RESPONSABILE = SUPERVISORE_RESPONSABILI.ID_RESPONSABILE AND SUPERVISORE_RESPONSABILI.ID_SUPERVISORE=? AND SUPERVISORE_RESPONSABILI.DATA_FINE_ASS IS NULL  
				   
					WHERE   
					 ((DATA_APPUNTAMENTO >= ? AND DATA_APPUNTAMENTO <= ?) OR  
				   (ESITO = "VALUTA" OR ESITO = "ASSENTE" OR ESITO = "NON VISITATO"  
				   OR (ESITO IS NULL AND DATA_APPUNTAMENTO <= ?))) 
				   
					 UNION
				   
			SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,  
					VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*  
					FROM APPUNTAMENTI   
					LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE  
				   LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE 
					
				   JOIN  SUPERVISORE_RESPONSABILI ON SUPERVISORE_RESPONSABILI.ID_RESPONSABILE = VENDITORE.ID_UTENTE AND SUPERVISORE_RESPONSABILI.ID_SUPERVISORE=? AND SUPERVISORE_RESPONSABILI.DATA_FINE_ASS IS NULL  
					 
					WHERE   
					 ((DATA_APPUNTAMENTO >= ? AND DATA_APPUNTAMENTO <= ?) OR  
				   (ESITO = "VALUTA" OR ESITO = "ASSENTE" OR ESITO = "NON VISITATO"  
				   OR (ESITO IS NULL AND DATA_APPUNTAMENTO <= ?))) `, [id, from, to, to, id, from, to, to, id, from, to, to],
                    function (err, rows, fields) {

                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL LISTA APPUNTAMENTI ' + err);
                            res.sendStatus(500);
                        } else {
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
app.post('/deleteDate', ensureToken, requireAdmin, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);

        } else {
            var id = req.body.id;
            var data = {};



            pool.getConnection(function (err, connection) {
                connection.beginTransaction(function (errTrans) {
                    if (errTrans) { //Transaction Error (Rollback and release connection)
                        connection.rollback(function () {
                            connection.release();
                        });
                        log.error('ERRORE SQL TRANSACTION CANCELLAZIONE APPUNTAMENTO ' + errTrans);
                        res.sendStatus(500);
                    } else {
                        connection.query('DELETE FROM APPUNTAMENTI WHERE ID_APPUNTAMENTO= ?', [id], function (err, rows, fields) {
                            if (err) {
                                connection.rollback(function () {
                                    connection.release();
                                    //Failure
                                });
                                log.error('ERRORE SQL CANCELLAZIONE APPUNTAMENTO ' + err);
                                res.sendStatus(500);

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
app.get('/listaNomiAziendaAndIdAppunamentoForProvincia/:provincia', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);

        } else {

            var data = {};

            var provincia = req.params.provincia;

            pool.getConnection(function (err, connection) {
                connection.query(
                    `SELECT APPUNTAMENTI.ID_APPUNTAMENTO, APPUNTAMENTI.NOME_ATTIVITA FROM APPUNTAMENTI WHERE PROVINCIA = ? `, [provincia],
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL GET LISTA NOME AZIENDA: ' + provincia + ' --> ' + err);
                            res.sendStatus(500);
                        } else {
                            if (rows.length !== 0) {
                                data["listaAziendaAndIdAppuntamento"] = rows;
                                res.json(data);
                            } else if (rows.length === 0) {
                                //Error code 2 = no rows in db.
                                data["error"] = 2;
                                data["listaAziendaAndIdAppuntamento"] = 'Nessuna lista nomi azienda trovata';
                                res.status(404).json(data);
                            } else {
                                data["appuntamento"] = 'Errore in fase di reperimento lista nomi azienda';
                                res.status(500).json(data);
                                console.log('Errore in fase di reperimento lista nomi azienda: ' + err);
                                log.error('Errore in fase di reperimento lista nomi azienda: ' + err);
                            }
                        }

                    });

            });

        }
    });
});


//Appuntamento
app.get('/appuntamento/:id', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);

        } else {

            var data = {};

            var idAppuntamento = req.params.id;

            pool.getConnection(function (err, connection) {
                connection.query(
                    'SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,' +
                    ' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*' +
                    ' FROM APPUNTAMENTI' +
                    ' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE' +
                    ' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE' +
                    ' WHERE APPUNTAMENTI.ID_APPUNTAMENTO = ?', [idAppuntamento],
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL GET APPUNTAMENTO: ' + idAppuntamento + ' --> ' + err);
                            res.sendStatus(500);
                        } else {
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
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};

            var limit = req.body.limit;
            //piccolo ANTI HACK
            if (limit > 200) {
                limit = 100;
            }

            var offset = req.body.offset;

            var dateFrom = req.body.dateFROM;
            var QdateFrom = " ";
            if (dateFrom !== '' && dateFrom !== undefined && dateFrom != null) {
                QdateFrom = ' AND DATA_APPUNTAMENTO >= "' + dateFrom + '" ';
            }

            var dateTo = req.body.dateTO;
            var QdateTo = " ";
            if (dateTo !== '' && dateTo !== undefined && dateTo != null) {
                QdateTo = ' AND DATA_APPUNTAMENTO <= "' + dateTo + '" ';
            }

            var provincia = req.body.provincia;
            var Qprovincia = " ";
            if (provincia !== '' && provincia !== undefined && provincia != null) {
                Qprovincia = ' AND PROVINCIA = "' + provincia + '" ';
            }

            var comune = req.body.comune;
            var Qcomune = " ";
            if (comune !== '' && comune !== undefined && comune != null) {
                Qcomune = ' AND COMUNE = "' + comune + '" ';
            }
            var ragioneSociale = req.body.ragioneSociale;
            var QragioneSociale = " ";
            if (ragioneSociale !== '' && ragioneSociale !== undefined && ragioneSociale != null) {
                QragioneSociale = ' AND LOWER(NOME_ATTIVITA) LIKE LOWER("%' + ragioneSociale + '%") ';
            }

            var esito = req.body.esito;
            var Qesito = " ";
            if (esito !== '' && esito !== undefined && esito != null) {
                if (esito == "NON ESITATO") {
                    Qesito = ' AND ESITO IS NULL ';
                } else {
                    Qesito = ' AND ESITO = "' + esito + '" ';
                }
            }

            var codiceLuce = req.body.codiceLuce;
            var QcodiceLuce = " ";
            if (codiceLuce !== '' && codiceLuce !== undefined && codiceLuce != null) {
                QcodiceLuce = ' AND CODICI_CONTRATTO_LUCE LIKE "%' + codiceLuce + '%" ';
            }

            var codiceGas = req.body.codiceGas;
            var QcodiceGas = " ";
            if (codiceGas !== '' && codiceGas !== undefined && codiceGas != null) {
                QcodiceGas = ' AND CODICI_CONTRATTO_GAS LIKE "%' + codiceGas + '%" ';
            }

            var agente = req.body.agente;
            var Qagente = " ";
            if (agente !== '' && agente !== undefined && agente != null) {
                Qagente = ' AND ID_VENDITORE = "' + agente + '" ';
            }

            var operatore = req.body.operatore;
            var Qoperatore = " ";
            if (operatore !== '' && operatore !== undefined && operatore != null) {
                Qoperatore = ' AND ID_OPERATORE = "' + operatore + '" ';
            }


            pool.getConnection(function (err, connection) {
                connection.query('SELECT COUNT(*) AS TotalCount from APPUNTAMENTI WHERE 1=1 ' + QdateFrom + QdateTo + Qprovincia + Qcomune + QragioneSociale + QcodiceLuce + QcodiceGas + Qagente + Qoperatore + Qesito + ' ORDER BY DATA_APPUNTAMENTO', function (err, rows, fields) {
                    connection.release();
                    if (err) {
                        log.error('ERRORE SQL RICERCA COUNT APPUNTAMENTI ' + err);
                        res.sendStatus(500);
                    } else {

                        data["totaleAppuntamenti"] = rows[0].TotalCount;

                        pool.getConnection(function (err, connection) {
                            connection.query(
                                'SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,' +
                                ' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*' +
                                ' FROM APPUNTAMENTI' +
                                ' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE' +
                                ' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE' +
                                ' WHERE 1=1 ' + QdateFrom + QdateTo + Qprovincia + Qcomune + QragioneSociale + QcodiceLuce + QcodiceGas + Qagente + Qoperatore + Qesito + ' ORDER BY DATA_APPUNTAMENTO DESC LIMIT ? OFFSET ?', [limit, offset],
                                function (err, rows, fields) {
                                    connection.release();
                                    if (err) {
                                        log.error('ERRORE SQL RICERCA APPUNTAMENTI: --> ' + err);
                                        res.sendStatus(500);
                                    } else {
                                        if (rows.length !== 0) {
                                            data["appuntamenti"] = rows;
                                            res.json(data);
                                        } else {
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


//DOWNLOAD APPUNTAMENTI
app.post('/downloadAppuntamenti', ensureToken, requireAdminOrResponsabile, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};

            var dateFrom = req.body.dateFROM;
            var QdateFrom = " ";
            if (dateFrom !== '' && dateFrom !== undefined && dateFrom != null) {
                QdateFrom = ' AND DATA_APPUNTAMENTO >= "' + dateFrom + '" ';
            }

            var dateTo = req.body.dateTO;
            var QdateTo = " ";
            if (dateTo !== '' && dateTo !== undefined && dateTo != null) {
                QdateTo = ' AND DATA_APPUNTAMENTO <= "' + dateTo + '" ';
            }

            var provincia = req.body.provincia;
            var Qprovincia = " ";
            if (provincia !== '' && provincia !== undefined && provincia != null) {
                Qprovincia = ' AND PROVINCIA = "' + provincia + '" ';
            }

            var comune = req.body.comune;
            var Qcomune = " ";
            if (comune !== '' && comune !== undefined && comune != null) {
                Qcomune = ' AND COMUNE = "' + comune + '" ';
            }
            var ragioneSociale = req.body.ragioneSociale;
            var QragioneSociale = " ";
            if (ragioneSociale !== '' && ragioneSociale !== undefined && ragioneSociale != null) {
                QragioneSociale = ' AND LOWER(NOME_ATTIVITA) LIKE LOWER("%' + ragioneSociale + '%") ';
            }

            var esito = req.body.esito;
            var Qesito = " ";
            if (esito !== '' && esito !== undefined && esito != null) {
                if (esito == "NON ESITATO") {
                    Qesito = ' AND ESITO IS NULL ';
                } else {
                    Qesito = ' AND ESITO = "' + esito + '" ';
                }
            }

            var codiceLuce = req.body.codiceLuce;
            var QcodiceLuce = " ";
            if (codiceLuce !== '' && codiceLuce !== undefined && codiceLuce != null) {
                QcodiceLuce = ' AND CODICI_CONTRATTO_LUCE LIKE "%' + codiceLuce + '%" ';
            }

            var codiceGas = req.body.codiceGas;
            var QcodiceGas = " ";
            if (codiceGas !== '' && codiceGas !== undefined && codiceGas != null) {
                QcodiceGas = ' AND CODICI_CONTRATTO_GAS LIKE "%' + codiceGas + '%" ';
            }

            var agente = req.body.agente;
            var Qagente = " ";
            if (agente !== '' && agente !== undefined && agente != null) {
                Qagente = ' AND ID_VENDITORE = "' + agente + '" ';
            }

            var operatore = req.body.operatore;
            var Qoperatore = " ";
            if (operatore !== '' && operatore !== undefined && operatore != null) {
                Qoperatore = ' AND ID_OPERATORE = "' + operatore + '" ';
            }



            pool.getConnection(function (err, connection) {
                connection.query(
                    'SELECT CONCAT(VENDITORE.COGNOME, " ",  VENDITORE.NOME) AS "Agente", ' +
                    ' CONCAT(OPERATORE.COGNOME, " ",  OPERATORE.NOME) AS "Operatore", ' +
                    ' DATE_FORMAT(APPUNTAMENTI.DATA_APPUNTAMENTO,"%d-%m-%y") as "Data Appuntamento", ' +
                    ' APPUNTAMENTI.NOME_ATTIVITA as "Ragione Sociale", ' +
                    ' CONCAT(APPUNTAMENTI.INDIRIZZO, " ",  APPUNTAMENTI.COMUNE) as "Indirizzo", ' +
                    ' APPUNTAMENTI.PROVINCIA as "Provincia", ' +
                    ' APPUNTAMENTI.ESITO as "Esito", ' +
                    ' APPUNTAMENTI.NOTE_OPERATORE as "Note Operatore", ' +
                    ' APPUNTAMENTI.NOTE_AGENTE as "Note Agente", ' +
                    ' APPUNTAMENTI.RECAPITI as "Recapiti", ' +
                    ' APPUNTAMENTI.ATTUALE_GESTORE as "Gestore" ' +
                    ' FROM APPUNTAMENTI' +
                    ' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE' +
                    ' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE' +
                    ' WHERE 1=1 ' + QdateFrom + QdateTo + Qprovincia + Qcomune + QragioneSociale + QcodiceLuce + QcodiceGas + Qagente + Qoperatore + Qesito + ' ORDER BY DATA_APPUNTAMENTO DESC ', [],
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL RICERCA APPUNTAMENTI: --> ' + err);
                            res.sendStatus(500);
                        } else {
                            if (rows.length !== 0) {
                                data["appuntamenti"] = rows;
                                res.json(data);
                            } else {
                                data["appuntamenti"] = [];
                                res.json(data);
                            }
                        }

                    });

            });



        }
    });
});

//RICERCA APPUNTAMENTI RESPONSABILE AGENTI
app.post('/searchDateResponsabile', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};

            var limit = req.body.limit;
            //piccolo ANTI HACK
            if (limit > 200) {
                limit = 100;
            }

            var offset = req.body.offset;

            var dateFrom = req.body.dateFROM;
            var QdateFrom = " ";
            if (dateFrom !== '' && dateFrom !== undefined && dateFrom != null) {
                QdateFrom = ' AND APPUNTAMENTI.DATA_APPUNTAMENTO >= "' + dateFrom + '" ';
            }

            var dateTo = req.body.dateTO;
            var QdateTo = " ";
            if (dateTo !== '' && dateTo !== undefined && dateTo != null) {
                QdateTo = ' AND APPUNTAMENTI.DATA_APPUNTAMENTO <= "' + dateTo + '" ';
            }

            var provincia = req.body.provincia;
            var Qprovincia = " ";
            if (provincia !== '' && provincia !== undefined && provincia != null) {
                Qprovincia = ' AND APPUNTAMENTI.PROVINCIA = "' + provincia + '" ';
            }

            var comune = req.body.comune;
            var Qcomune = " ";
            if (comune !== '' && comune !== undefined && comune != null) {
                Qcomune = ' AND APPUNTAMENTI.COMUNE = "' + comune + '" ';
            }
            var ragioneSociale = req.body.ragioneSociale;
            var QragioneSociale = " ";
            if (ragioneSociale !== '' && ragioneSociale !== undefined && ragioneSociale != null) {
                QragioneSociale = ' AND LOWER(APPUNTAMENTI.NOME_ATTIVITA) LIKE LOWER("%' + ragioneSociale + '%") ';
            }

            var esito = req.body.esito;
            var Qesito = " ";

            if (esito !== '' && esito !== undefined && esito != null) {
                if (esito == "NON ESITATO") {
                    Qesito = ' AND ESITO IS NULL ';
                } else {
                    Qesito = ' AND ESITO = "' + esito + '" ';
                }
            }

            var codiceLuce = req.body.codiceLuce;
            var QcodiceLuce = " ";
            if (codiceLuce !== '' && codiceLuce !== undefined && codiceLuce != null) {
                QcodiceLuce = ' AND APPUNTAMENTI.CODICI_CONTRATTO_LUCE LIKE "%' + codiceLuce + '%" ';
            }

            var codiceGas = req.body.codiceGas;
            var QcodiceGas = " ";
            if (codiceGas !== '' && codiceGas !== undefined && codiceGas != null) {
                QcodiceGas = ' AND APPUNTAMENTI.CODICI_CONTRATTO_GAS LIKE "%' + codiceGas + '%" ';
            }

            var agente = req.body.agente;
            var Qagente = " ";
            if (agente !== '' && agente !== undefined && agente != null) {
                Qagente = ' AND APPUNTAMENTI.ID_VENDITORE = "' + agente + '" ';
            }

            var idResponsabile = req.body.idResponsabile;


            pool.getConnection(function (err, connection) {
                connection.query('SELECT COUNT(*) AS TotalCount  FROM( SELECT  APPUNTAMENTI.ID_APPUNTAMENTO  ' +
                    ' FROM APPUNTAMENTI JOIN RESPONSABILI_AGENTI ON APPUNTAMENTI.ID_VENDITORE=RESPONSABILI_AGENTI.ID_AGENTE AND RESPONSABILI_AGENTI.ID_RESPONSABILE=? AND DATA_FINE_ASS IS NULL  LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE ' +
                    ' WHERE 1=1 ' + QdateFrom + QdateTo + Qprovincia + Qcomune + QragioneSociale + QcodiceLuce + QcodiceGas + Qagente + Qesito +
                    ' UNION ' +
                    ' SELECT   APPUNTAMENTI.ID_APPUNTAMENTO FROM APPUNTAMENTI LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE ' +
                    '  WHERE VENDITORE.ID_UTENTE=? ' + QdateFrom + QdateTo + Qprovincia + Qcomune + QragioneSociale + QcodiceLuce + QcodiceGas + Qagente + Qesito + ' ' +

                    ' UNION ' +

                    ' SELECT APPUNTAMENTI.ID_APPUNTAMENTO ' +
                    ' FROM APPUNTAMENTI  ' +
                    ' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE  ' +
                    ' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE  ' +
                    ' JOIN RESPONSABILI_AGENTI ON APPUNTAMENTI.ID_VENDITORE=RESPONSABILI_AGENTI.ID_AGENTE  AND RESPONSABILI_AGENTI.DATA_FINE_ASS IS NULL  ' +
                    ' JOIN  SUPERVISORE_RESPONSABILI ON RESPONSABILI_AGENTI.ID_RESPONSABILE = SUPERVISORE_RESPONSABILI.ID_RESPONSABILE AND SUPERVISORE_RESPONSABILI.ID_SUPERVISORE=? AND SUPERVISORE_RESPONSABILI.DATA_FINE_ASS IS NULL  ' +

                    ' WHERE  1=1 ' + QdateFrom + QdateTo + Qprovincia + Qcomune + QragioneSociale + QcodiceLuce + QcodiceGas + Qagente + Qesito + ' ' +

                    ' UNION ' +

                    ' SELECT APPUNTAMENTI.ID_APPUNTAMENTO   ' +
                    ' FROM APPUNTAMENTI  ' +
                    ' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE  ' +
                    ' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE  ' +

                    ' JOIN  SUPERVISORE_RESPONSABILI ON SUPERVISORE_RESPONSABILI.ID_RESPONSABILE = VENDITORE.ID_UTENTE AND SUPERVISORE_RESPONSABILI.ID_SUPERVISORE=? AND SUPERVISORE_RESPONSABILI.DATA_FINE_ASS IS NULL   ' +

                    ' WHERE  1=1 ' + QdateFrom + QdateTo + Qprovincia + Qcomune + QragioneSociale + QcodiceLuce + QcodiceGas + Qagente + Qesito + ' ' +

                    ' ) SOMMA_APPUNTAMENTI', [idResponsabile, idResponsabile, idResponsabile, idResponsabile],
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL RICERCA COUNT APPUNTAMENTI ' + err);
                            res.sendStatus(500);
                        } else {

                            data["totaleAppuntamenti"] = rows[0].TotalCount;

                            pool.getConnection(function (err, connection) {
                                connection.query(
                                    'SELECT  OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,' +
                                    ' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.* ' +
                                    ' FROM APPUNTAMENTI' +
                                    '  JOIN RESPONSABILI_AGENTI ON APPUNTAMENTI.ID_VENDITORE=RESPONSABILI_AGENTI.ID_AGENTE AND RESPONSABILI_AGENTI.ID_RESPONSABILE=? AND DATA_FINE_ASS IS NULL ' +
                                    ' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE' +
                                    ' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE' +
                                    ' WHERE 1=1 ' + QdateFrom + QdateTo + Qprovincia + Qcomune + QragioneSociale + QcodiceLuce + QcodiceGas + Qagente + Qesito + ' ' +
                                    ' UNION ' +
                                    ' SELECT  OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE, ' +
                                    ' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.* ' +
                                    '  FROM APPUNTAMENTI ' +
                                    ' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE ' +
                                    ' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE ' +
                                    ' WHERE VENDITORE.ID_UTENTE=? ' + QdateFrom + QdateTo + Qprovincia + Qcomune + QragioneSociale + QcodiceLuce + QcodiceGas + Qagente + Qesito + ' ' +

                                    ' UNION ' +

                                    ' SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE, ' +
                                    ' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*  ' +
                                    ' FROM APPUNTAMENTI  ' +
                                    ' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE  ' +
                                    ' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE  ' +
                                    ' JOIN RESPONSABILI_AGENTI ON APPUNTAMENTI.ID_VENDITORE=RESPONSABILI_AGENTI.ID_AGENTE  AND RESPONSABILI_AGENTI.DATA_FINE_ASS IS NULL  ' +
                                    ' JOIN  SUPERVISORE_RESPONSABILI ON RESPONSABILI_AGENTI.ID_RESPONSABILE = SUPERVISORE_RESPONSABILI.ID_RESPONSABILE AND SUPERVISORE_RESPONSABILI.ID_SUPERVISORE=? AND SUPERVISORE_RESPONSABILI.DATA_FINE_ASS IS NULL  ' +

                                    ' WHERE  1=1 ' + QdateFrom + QdateTo + Qprovincia + Qcomune + QragioneSociale + QcodiceLuce + QcodiceGas + Qagente + Qesito + ' ' +

                                    ' UNION ' +

                                    ' SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,  ' +
                                    ' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*   ' +
                                    ' FROM APPUNTAMENTI  ' +
                                    ' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE  ' +
                                    ' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE  ' +

                                    ' JOIN  SUPERVISORE_RESPONSABILI ON SUPERVISORE_RESPONSABILI.ID_RESPONSABILE = VENDITORE.ID_UTENTE AND SUPERVISORE_RESPONSABILI.ID_SUPERVISORE=? AND SUPERVISORE_RESPONSABILI.DATA_FINE_ASS IS NULL   ' +

                                    ' WHERE  1=1 ' + QdateFrom + QdateTo + Qprovincia + Qcomune + QragioneSociale + QcodiceLuce + QcodiceGas + Qagente + Qesito + ' ' +

                                    ' ORDER BY DATA_APPUNTAMENTO DESC LIMIT ? OFFSET ?', [idResponsabile, idResponsabile, idResponsabile, idResponsabile, limit, offset],
                                    function (err, rows, fields) {
                                        connection.release();
                                        if (err) {
                                            log.error('ERRORE SQL RICERCA APPUNTAMENTI: --> ' + err);
                                            res.sendStatus(500);
                                        } else {
                                            if (rows.length !== 0) {
                                                data["appuntamenti"] = rows;
                                                res.json(data);
                                            } else {
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

//VERIFICA APPUNTAMENTI GENERICA
app.post('/verifyDate', ensureToken, requireAdminOrBackOffice, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};

            var limit = req.body.limit;
            //piccolo ANTI HACK
            if (limit > 200) {
                limit = 100;
            }

            var offset = req.body.offset;

            var dateFrom = req.body.dateFROM;
            var QdateFrom = " ";
            if (dateFrom !== '' && dateFrom !== undefined && dateFrom != null) {
                QdateFrom = ' AND DATA_APPUNTAMENTO >= "' + dateFrom + '" ';
            }

            var dateTo = req.body.dateTO;
            var QdateTo = " ";
            if (dateTo !== '' && dateTo !== undefined && dateTo != null) {
                QdateTo = ' AND DATA_APPUNTAMENTO <= "' + dateTo + '" ';
            }

            var provincia = req.body.provincia;
            var Qprovincia = " ";
            if (provincia !== '' && provincia !== undefined && provincia != null) {
                Qprovincia = ' AND PROVINCIA = "' + provincia + '" ';
            }

            var comune = req.body.comune;
            var Qcomune = " ";
            if (comune !== '' && comune !== undefined && comune != null) {
                Qcomune = ' AND COMUNE = "' + comune + '" ';
            }



            var Qesito = ' AND ESITO = "OK" ';



            var agente = req.body.agente;
            var Qagente = " ";
            if (agente !== '' && agente !== undefined && agente != null) {
                Qagente = ' AND ID_VENDITORE = "' + agente + '" ';
            }




            pool.getConnection(function (err, connection) {
                connection.query('SELECT COUNT(*) AS TotalCount from APPUNTAMENTI WHERE 1=1 ' + QdateFrom + QdateTo + Qprovincia + Qcomune + Qagente + Qesito + ' ORDER BY DATA_APPUNTAMENTO', function (err, rows, fields) {
                    connection.release();
                    if (err) {
                        log.error('ERRORE SQL RICERCA COUNT APPUNTAMENTI ' + err);
                        res.sendStatus(500);
                    } else {

                        data["totaleAppuntamenti"] = rows[0].TotalCount;

                        pool.getConnection(function (err, connection) {
                            connection.query(
                                'SELECT OPERATORE.NOME NOME_OPERATORE, OPERATORE.COGNOME COGNOME_OPERATORE,' +
                                ' VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE, APPUNTAMENTI.*' +
                                ' FROM APPUNTAMENTI' +
                                ' LEFT JOIN UTENTI OPERATORE ON APPUNTAMENTI.ID_OPERATORE=OPERATORE.ID_UTENTE' +
                                ' LEFT JOIN UTENTI VENDITORE ON APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE' +
                                ' WHERE 1=1 ' + QdateFrom + QdateTo + Qprovincia + Qcomune + Qagente + Qesito + ' ORDER BY DATA_APPUNTAMENTO DESC LIMIT ? OFFSET ?', [limit, offset],
                                function (err, rows, fields) {
                                    connection.release();
                                    if (err) {
                                        log.error('ERRORE SQL RICERCA APPUNTAMENTI: --> ' + err);
                                        res.sendStatus(500);
                                    } else {
                                        if (rows.length !== 0) {
                                            data["appuntamenti"] = rows;
                                            res.json(data);
                                        } else {
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



//STATISTICHE APPUNTAMENTI
app.post('/dateStats', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};
            // date per le statistiche inerenti al range selezionato
            var dateFrom = req.body.dateFROM;
            var QdateFrom = " ";
            if (dateFrom == '' || dateFrom == undefined || dateFrom == null) {
                dateFrom = "2000-01-01";
            }
            QdateFrom = ' AND APPUNTAMENTI.DATA_APPUNTAMENTO >= "' + dateFrom + '" ';

            var dateTo = req.body.dateTO;
            var QdateTo = " ";

            if (dateTo == '' || dateTo == undefined || dateTo == null) {
                // SE NON HO SETTATO LA DATE_TO LA SETTO A UN GIORNO PRIMA RISPETTO AL GIORNO CORRENTE
                var today = new Date();
                var meseCorrente = today.getMonth() + 1;
                var giornoCorrenteMenoUno = today.getDate() - 1;
                var annoCorrente = today.getFullYear();
                dateTo = annoCorrente + "-" + meseCorrente + "-" + giornoCorrenteMenoUno;
            }

            QdateTo = ' AND APPUNTAMENTI.DATA_APPUNTAMENTO <= "' + dateTo + '" ';

            // date per il conteggio degli appuntamenti presi in precedenza ma chiusi(OK - data_ok) nel range selezionato.

            var Q_dateOK_From = ' AND APPUNTAMENTI.DATA_APPUNTAMENTO < "' + dateFrom + '" AND APPUNTAMENTI.DATA_OK >= "' + dateFrom + '" ';
            var Q_dateOK_To = ' AND APPUNTAMENTI.DATA_OK <= "' + dateTo + '" ';


            var agente = req.body.agente;
            var Qagente = " ";
            if (agente !== '' && agente !== undefined && agente != null) {
                Qagente = ' AND APPUNTAMENTI.ID_VENDITORE = "' + agente + '" ';
            }

            var operatore = req.body.operatore;
            var Qoperatore = " ";
            if (operatore !== '' && operatore !== undefined && operatore != null) {
                Qoperatore = ' AND APPUNTAMENTI.ID_OPERATORE = "' + operatore + '" ';
            }


            pool.getConnection(function (err, connection) {
                connection.query(
                    ` select * from 
					(select
					UTENTI.ID_UTENTE,
					UTENTI.COGNOME,
					UTENTI.NOME,
					UTENTI.TIPO,
					COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS APPUNTAMENTI,
					SUM(IFNULL(APPUNTAMENTI.NUM_LUCE,0))+SUM(IFNULL(APPUNTAMENTI.NUM_GAS,0))  AS CONTRATTI,
					ROUND((SUM(IFNULL(APPUNTAMENTI.NUM_LUCE,0))+SUM(IFNULL(APPUNTAMENTI.NUM_GAS,0)))/COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0) AS PERC_CONTRATTI_O_APPUNTAMENTI,
					COUNT(IF(APPUNTAMENTI.ESITO='OK',1, null)) AS OK,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='OK',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS OK_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='KO',1, null)) AS KO,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='KO',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS KO_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='VALUTA',1, null)) AS VALUTA,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='VALUTA',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS VALUTA_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='ASSENTE',1, null)) AS ASSENTE,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='ASSENTE',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS ASSENTE_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='NON VISITATO',1, null)) AS NON_VISITATO,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='NON VISITATO',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS NON_VISITATO_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO IS NULL,1, null)) AS DA_ESITARE,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO IS NULL,1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS DA_ESITARE_PERC 
					
					from APPUNTAMENTI 
					left join UTENTI ON  APPUNTAMENTI.ID_VENDITORE=UTENTI.ID_UTENTE
					
					WHERE 1=1 ${QdateFrom} ${QdateTo} ${Qagente} ${Qoperatore}
					group by UTENTI.ID_UTENTE 
					
					UNION
					
					select
					UTENTI.ID_UTENTE,
					UTENTI.COGNOME,
					UTENTI.NOME,
					UTENTI.TIPO,
					COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS APPUNTAMENTI,
					SUM(IFNULL(APPUNTAMENTI.NUM_LUCE,0))+SUM(IFNULL(APPUNTAMENTI.NUM_GAS,0))  AS CONTRATTI,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='OK',1, null))/COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0) AS PERC_CONTRATTI_O_APPUNTAMENTI,
					COUNT(IF(APPUNTAMENTI.ESITO='OK',1, null)) AS OK,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='OK',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS OK_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='KO',1, null)) AS KO,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='KO',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS KO_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='VALUTA',1, null)) AS VALUTA,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='VALUTA',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS VALUTA_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='ASSENTE',1, null)) AS ASSENTE,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='ASSENTE',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS ASSENTE_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='NON VISITATO',1, null)) AS NON_VISITATO,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='NON VISITATO',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS NON_VISITATO_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO IS NULL,1, null)) AS DA_ESITARE,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO IS NULL,1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS DA_ESITARE_PERC 

					from APPUNTAMENTI 

					left join UTENTI ON  APPUNTAMENTI.ID_OPERATORE=UTENTI.ID_UTENTE

					WHERE 1=1 ${QdateFrom} ${QdateTo} ${Qagente} ${Qoperatore}
					
					group by UTENTI.ID_UTENTE) as tab1 
					 left join (
						select 
							APPUNTAMENTI.ID_VENDITORE AS ID_UTENTE_2,
							COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS OK_PRECEDENTI
							FROM APPUNTAMENTI
							WHERE 1=1  ${Q_dateOK_From} ${Q_dateOK_To} ${Qagente} ${Qoperatore} 
							 group by APPUNTAMENTI.ID_VENDITORE
							UNION 
								select 
							APPUNTAMENTI.ID_OPERATORE AS ID_UTENTE_2,
							COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS OK_PRECEDENTI
							FROM APPUNTAMENTI
							WHERE 1=1 ${Q_dateOK_From} ${Q_dateOK_To} ${Qagente} ${Qoperatore}
							 group by APPUNTAMENTI.ID_OPERATORE
					) as tab2 on tab1.ID_UTENTE = tab2.ID_UTENTE_2`,
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {

                            log.error('ERRORE SQL STATS ADMIN: --> ' + err);
                            res.sendStatus(500);
                        } else {
                            if (rows.length !== 0 && !err) {

                                data["stats"] = rows;
                                res.json(data);
                            } else if (rows.length === 0) {
                                //Error code 2 = no rows in db.
                                data["error"] = 2;
                                data["stats"] = 'Nessuna statistica trovata';
                                res.status(404).json(data);
                            } else {
                                data["stats"] = 'Errore in fase di reperimento utente';
                                res.status(500).json(data);
                                console.log('Errore in fase di reperimento utenti: ' + err);
                                log.error('Errore in fase di reperimento utenti: ' + err);
                            }
                        }

                    });

            });




        }
    });
});
//VERIFICA STATISTICHE APPUNTAMENTI
app.post('/verifyDateStats', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};
            var idUtente = req.body.idUtente;
            var dateFrom = req.body.dateFROM;
            var QdateFrom = " ";
            if (dateFrom !== '' && dateFrom !== undefined && dateFrom != null) {
                QdateFrom = ' AND (APPUNTAMENTI.DATA_APPUNTAMENTO >= "' + dateFrom + '" OR APPUNTAMENTI.DATA_OK >= "' + dateFrom + '" )';
            }

            var dateTo = req.body.dateTO;
            var QdateTo = " ";
            if (dateTo !== '' && dateTo !== undefined && dateTo != null) {
                QdateTo = ' AND (APPUNTAMENTI.DATA_APPUNTAMENTO <= "' + dateTo + '" OR APPUNTAMENTI.DATA_OK <= "' + dateTo + '" )';
            } else {
                // SE NO NON HO SETTATO LA DATE_TO LA SETTO AD UN GIORNO PRIMA RISPETTO IL GIORNO CORRENTE
                var today = new Date();
                var meseCorrente = today.getMonth() + 1;
                var giornoCorrenteMenoUno = today.getDate() - 1;
                var annoCorrente = today.getFullYear();
                var dateToTodayMenoUno = annoCorrente + "-" + meseCorrente + "-" + giornoCorrenteMenoUno;

                QdateTo = ' AND (APPUNTAMENTI.DATA_APPUNTAMENTO <= "' + dateToTodayMenoUno + '" OR APPUNTAMENTI.DATA_OK <= "' + dateToTodayMenoUno + '" )';

            }



            var agente = req.body.agente;
            var Qagente = " ";
            if (agente !== '' && agente !== undefined && agente != null) {
                Qagente = ' AND APPUNTAMENTI.ID_VENDITORE = "' + agente + '" ';
            }

            var operatore = req.body.operatore;
            var Qoperatore = " ";
            if (operatore !== '' && operatore !== undefined && operatore != null) {
                Qoperatore = ' AND APPUNTAMENTI.ID_OPERATORE = "' + operatore + '" ';
            }


            pool.getConnection(function (err, connection) {
                connection.query(
                    `select
					VENDITORE.ID_UTENTE AS ID_VENDITORE,
					VENDITORE.COGNOME AS COGNOME_VENDITORE,
					VENDITORE.NOME AS NOME_VENDITORE,
					VENDITORE.TIPO AS TIPO_VENDITORE,
					OPERATORE.ID_UTENTE AS ID_OPERATORE,
					OPERATORE.COGNOME AS COGNOME_OPERATORE,
					OPERATORE.NOME AS NOME_OPERATORE,
					OPERATORE.TIPO AS TIPO_OPERATORE,
					APPUNTAMENTI.DATA_APPUNTAMENTO,
					APPUNTAMENTI.NOME_ATTIVITA,
					APPUNTAMENTI.PROVINCIA,
					APPUNTAMENTI.COMUNE,
					APPUNTAMENTI.ESITO,
					APPUNTAMENTI.DATA_OK

					
					from APPUNTAMENTI 
					left join UTENTI  AS VENDITORE ON  APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE
					left join UTENTI AS OPERATORE ON  APPUNTAMENTI.ID_OPERATORE = OPERATORE.ID_UTENTE 
					
					WHERE 1=1 ${QdateFrom} ${QdateTo} ${Qagente} ${Qoperatore} AND VENDITORE.ID_UTENTE=${idUtente} 
					
					
					UNION
					
					select
					VENDITORE.ID_UTENTE AS ID_VENDITORE,
					VENDITORE.COGNOME AS COGNOME_VENDITORE,
					VENDITORE.NOME AS NOME_VENDITORE,
					VENDITORE.TIPO AS TIPO_VENDITORE,
					OPERATORE.ID_UTENTE AS ID_OPERATORE,
					OPERATORE.COGNOME AS COGNOME_OPERATORE,
					OPERATORE.NOME AS NOME_OPERATORE,
					OPERATORE.TIPO AS TIPO_OPERATORE,
					APPUNTAMENTI.DATA_APPUNTAMENTO,
					APPUNTAMENTI.NOME_ATTIVITA,
					APPUNTAMENTI.PROVINCIA,
					APPUNTAMENTI.COMUNE,
					APPUNTAMENTI.ESITO,
					APPUNTAMENTI.DATA_OK

					
					from APPUNTAMENTI 
					left join UTENTI AS VENDITORE ON  APPUNTAMENTI.ID_VENDITORE=VENDITORE.ID_UTENTE
					left join UTENTI AS OPERATORE ON  APPUNTAMENTI.ID_OPERATORE = OPERATORE.ID_UTENTE 
					
					WHERE 1=1 ${QdateFrom} ${QdateTo} ${Qagente} ${Qoperatore} AND OPERATORE.ID_UTENTE=${idUtente} 
					
					`,
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL STATS ADMIN: --> ' + err);
                            res.sendStatus(500);
                        } else {
                            if (rows.length !== 0 && !err) {
                                data["verifyStats"] = rows;
                                res.json(data);
                            } else if (rows.length === 0) {
                                //Error code 2 = no rows in db.
                                data["error"] = 2;
                                data["verifyStats"] = 'Nessuna statistica trovata';
                                res.status(404).json(data);
                            } else {
                                data["verifyStats"] = 'Errore in fase di reperimento utente';
                                res.status(500).json(data);
                                console.log('Errore in fase di reperimento utenti: ' + err);
                                log.error('Errore in fase di reperimento utenti: ' + err);
                            }
                        }

                    });

            });




        }
    });
});

//STATISTICHE APPUNTAMENTI DASHBOARD ADMIN
app.get('/dateStatsAdminDashboard', ensureToken, requireAdminOrBackOffice, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};
            var today = new Date();
            var meseCorrente = today.getMonth() + 1;
            var giornoCorrenteMenoUno = today.getDate() - 1;
            var annoCorrente = today.getFullYear();
            var dateToTodayMenoUno = annoCorrente + "-" + meseCorrente + "-" + giornoCorrenteMenoUno;

            pool.getConnection(function (err, connection) {
                connection.query(
                    `select
					
					COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS APPUNTAMENTI,
					SUM(IFNULL(APPUNTAMENTI.NUM_LUCE,0))+SUM(IFNULL(APPUNTAMENTI.NUM_GAS,0))  AS CONTRATTI,
					ROUND((SUM(IFNULL(APPUNTAMENTI.NUM_LUCE,0))+SUM(IFNULL(APPUNTAMENTI.NUM_GAS,0)))/COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0) AS PERC_CONTRATTI_O_APPUNTAMENTI,
					COUNT(IF(APPUNTAMENTI.ESITO='OK',1, null)) AS OK,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='OK',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS OK_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='KO',1, null)) AS KO,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='KO',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS KO_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='VALUTA',1, null)) AS VALUTA,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='VALUTA',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS VALUTA_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='ASSENTE',1, null)) AS ASSENTE,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='ASSENTE',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS ASSENTE_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='NON VISITATO',1, null)) AS NON_VISITATO,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='NON VISITATO',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS NON_VISITATO_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO IS NULL,1, null)) AS DA_ESITARE,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO IS NULL,1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS DA_ESITARE_PERC 
					
					from APPUNTAMENTI 

					WHERE APPUNTAMENTI.DATA_APPUNTAMENTO <= ?

					`, [dateToTodayMenoUno],
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL STATS DASHBOARD ADMIN: --> ' + err);
                            res.sendStatus(500);
                        } else {
                            if (rows.length !== 0 && !err) {
                                data["stats"] = rows[0];
                                res.json(data);
                            } else if (rows.length === 0) {
                                //Error code 2 = no rows in db.
                                data["error"] = 2;
                                data["stats"] = 'Nessuna statistica trovata';
                                res.status(404).json(data);
                            } else {
                                data["stats"] = 'Errore in fase di reperimento statistiche dashboard';
                                res.status(500).json(data);
                                console.log('Errore in fase di reperimento statistiche dashboard: ' + err);
                                log.error('Errore in fase di reperimento statistiche dashboard: ' + err);
                            }
                        }

                    });

            });




        }
    });
});


//STATISTICHE APPUNTAMENTI DASHBOARD VENDITORI
app.get('/dateStatsVenditoreDashboard/:id', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var idVenditore = req.params.id;
            var data = {};
            var today = new Date();
            var meseCorrente = today.getMonth() + 1;
            var giornoCorrenteMenoUno = today.getDate() - 1;
            var annoCorrente = today.getFullYear();
            var dateToTodayMenoUno = annoCorrente + "-" + meseCorrente + "-" + giornoCorrenteMenoUno;

            pool.getConnection(function (err, connection) {
                connection.query(
                    `select
					
					COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS APPUNTAMENTI,
					SUM(IFNULL(APPUNTAMENTI.NUM_LUCE,0))+SUM(IFNULL(APPUNTAMENTI.NUM_GAS,0))  AS CONTRATTI,
					ROUND((SUM(IFNULL(APPUNTAMENTI.NUM_LUCE,0))+SUM(IFNULL(APPUNTAMENTI.NUM_GAS,0)))/COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0) AS PERC_CONTRATTI_O_APPUNTAMENTI,
					COUNT(IF(APPUNTAMENTI.ESITO='OK',1, null)) AS OK,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='OK',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS OK_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='KO',1, null)) AS KO,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='KO',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS KO_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='VALUTA',1, null)) AS VALUTA,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='VALUTA',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS VALUTA_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='ASSENTE',1, null)) AS ASSENTE,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='ASSENTE',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS ASSENTE_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='NON VISITATO',1, null)) AS NON_VISITATO,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='NON VISITATO',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS NON_VISITATO_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO IS NULL,1, null)) AS DA_ESITARE,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO IS NULL,1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS DA_ESITARE_PERC 
					
					from APPUNTAMENTI 

					WHERE APPUNTAMENTI.DATA_APPUNTAMENTO <= ? AND APPUNTAMENTI.ID_VENDITORE = ?

					`, [dateToTodayMenoUno, idVenditore],
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL STATS DASHBOARD venditore: --> ' + err);
                            res.sendStatus(500);
                        } else {
                            if (rows.length !== 0 && !err) {
                                data["stats"] = rows[0];
                                res.json(data);
                            } else if (rows.length === 0) {
                                //Error code 2 = no rows in db.
                                data["error"] = 2;
                                data["stats"] = 'Nessuna statistica venditore trovata';
                                res.status(404).json(data);
                            } else {
                                data["stats"] = 'Errore in fase di reperimento statistiche dashboard venditore';
                                res.status(500).json(data);
                                console.log('Errore in fase di reperimento statistiche dashboard venditore: ' + err);
                                log.error('Errore in fase di reperimento statistiche dashboard venditore: ' + err);
                            }
                        }

                    });

            });




        }
    });
});
//STATISTICHE APPUNTAMENTI DASHBOARD Operatori
app.get('/dateStatsOperatoreDashboard/:id', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var idOperatore = req.params.id;
            var data = {};
            var today = new Date();
            var meseCorrente = today.getMonth() + 1;
            var giornoCorrenteMenoUno = today.getDate() - 1;
            var annoCorrente = today.getFullYear();
            var dateToTodayMenoUno = annoCorrente + "-" + meseCorrente + "-" + giornoCorrenteMenoUno;

            pool.getConnection(function (err, connection) {
                connection.query(
                    `select
					
					COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS APPUNTAMENTI,
					SUM(IFNULL(APPUNTAMENTI.NUM_LUCE,0))+SUM(IFNULL(APPUNTAMENTI.NUM_GAS,0))  AS CONTRATTI,
					ROUND((SUM(IFNULL(APPUNTAMENTI.NUM_LUCE,0))+SUM(IFNULL(APPUNTAMENTI.NUM_GAS,0)))/COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0) AS PERC_CONTRATTI_O_APPUNTAMENTI,
					COUNT(IF(APPUNTAMENTI.ESITO='OK',1, null)) AS OK,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='OK',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS OK_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='KO',1, null)) AS KO,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='KO',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS KO_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='VALUTA',1, null)) AS VALUTA,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='VALUTA',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS VALUTA_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='ASSENTE',1, null)) AS ASSENTE,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='ASSENTE',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS ASSENTE_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO='NON VISITATO',1, null)) AS NON_VISITATO,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO='NON VISITATO',1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS NON_VISITATO_PERC,
					COUNT(IF(APPUNTAMENTI.ESITO IS NULL,1, null)) AS DA_ESITARE,
					ROUND(COUNT(IF(APPUNTAMENTI.ESITO IS NULL,1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100,0)  AS DA_ESITARE_PERC 
					
					from APPUNTAMENTI 

					WHERE APPUNTAMENTI.DATA_APPUNTAMENTO <= ? AND APPUNTAMENTI.ID_OPERATORE = ?

					`, [dateToTodayMenoUno, idOperatore],
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL STATS DASHBOARD venditore: --> ' + err);
                            res.sendStatus(500);
                        } else {
                            if (rows.length !== 0 && !err) {
                                data["stats"] = rows[0];
                                res.json(data);
                            } else if (rows.length === 0) {
                                //Error code 2 = no rows in db.
                                data["error"] = 2;
                                data["stats"] = 'Nessuna statistica venditore trovata';
                                res.status(404).json(data);
                            } else {
                                data["stats"] = 'Errore in fase di reperimento statistiche dashboard venditore';
                                res.status(500).json(data);
                                console.log('Errore in fase di reperimento statistiche dashboard venditore: ' + err);
                                log.error('Errore in fase di reperimento statistiche dashboard venditore: ' + err);
                            }
                        }

                    });

            });




        }
    });
});


app.get('/listaUtentiForOperatore/:id', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var idOperatore = req.params.id;
            var data = {};
            pool.getConnection(function (err, connection) {
                connection.query(
                    'SELECT * FROM UTENTI AS UT ' +
                    ' JOIN ' +
                    ' (SELECT * FROM OPERATORI_VENDITORI AS OP WHERE OP.ID_OPERATORE = ? AND OP.DATA_FINE_ASS IS NULL ) AS T ON UT.ID_UTENTE=T.ID_AGENTE WHERE UT.UTENTE_ATTIVO = 1', [idOperatore],
                    function (err, rows, fields) {
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

//STATISTICHE APPUNTAMENTI GRUPPO VENDITA
app.post("/dateStatsGruppoVendita", ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};
            var idResponsabile = req.body.idResponsabile;
            var dateFrom = req.body.dateFROM;
            var QdateFrom = " ";
            if (dateFrom == "" || dateFrom == undefined || dateFrom == null) {
                dateFrom = "2000-01-01";
            }
            QdateFrom = ' AND APPUNTAMENTI.DATA_APPUNTAMENTO >= "' + dateFrom + '" ';

            var dateTo = req.body.dateTO;
            var QdateTo = " ";

            if (dateTo == "" || dateTo == undefined || dateTo == null) {
                // SE NON HO SETTATO LA DATE_TO LA SETTO A UN GIORNO PRIMA RISPETTO AL GIORNO CORRENTE
                var today = new Date();
                var meseCorrente = today.getMonth() + 1;
                var giornoCorrenteMenoUno = today.getDate() - 1;
                var annoCorrente = today.getFullYear();
                dateTo =
                    annoCorrente + "-" + meseCorrente + "-" + giornoCorrenteMenoUno;
            }

            QdateTo = ' AND APPUNTAMENTI.DATA_APPUNTAMENTO <= "' + dateTo + '" ';

            // date per il conteggio degli appuntamenti presi in precedenza ma chiusi(OK - data_ok) nel range selezionato.

            var Q_dateOK_From =
                ' AND APPUNTAMENTI.DATA_APPUNTAMENTO < "' +
                dateFrom +
                '" AND APPUNTAMENTI.DATA_OK >= "' +
                dateFrom +
                '" ';
            var Q_dateOK_To = ' AND APPUNTAMENTI.DATA_OK <= "' + dateTo + '" ';

            var agente = req.body.agente;
            var Qagente = " ";
            if (agente !== "" && agente !== undefined && agente != null) {
                Qagente = ' AND APPUNTAMENTI.ID_VENDITORE = "' + agente + '" ';
            }

            pool.getConnection(function (err, connection) {
                connection.query(
                    `select * from 
					  (select
					  UTENTI.ID_UTENTE,
					  UTENTI.COGNOME,
					  UTENTI.NOME,
					  UTENTI.TIPO,
					  COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS APPUNTAMENTI,
					  SUM(IFNULL(APPUNTAMENTI.NUM_LUCE, 0)) + SUM(IFNULL(APPUNTAMENTI.NUM_GAS, 0)) AS CONTRATTI,
					  ROUND((SUM(IFNULL(APPUNTAMENTI.NUM_LUCE, 0)) + SUM(IFNULL(APPUNTAMENTI.NUM_GAS, 0))) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS PERC_CONTRATTI_O_APPUNTAMENTI,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'OK', 1, null)) AS OK,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'OK', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS OK_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'KO', 1, null)) AS KO,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'KO', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS KO_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'VALUTA', 1, null)) AS VALUTA,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'VALUTA', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS VALUTA_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'ASSENTE', 1, null)) AS ASSENTE,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'ASSENTE', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS ASSENTE_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'NON VISITATO', 1, null)) AS NON_VISITATO,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'NON VISITATO', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS NON_VISITATO_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO IS NULL, 1, null)) AS DA_ESITARE,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO IS NULL, 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS DA_ESITARE_PERC 
				   from
					  APPUNTAMENTI 
					  inner join
						 RESPONSABILI_AGENTI 
						 ON RESPONSABILI_AGENTI.ID_RESPONSABILE =? 
						 AND RESPONSABILI_AGENTI.ID_AGENTE = APPUNTAMENTI.ID_VENDITORE 
					  left join
						 UTENTI 
						 ON APPUNTAMENTI.ID_VENDITORE = UTENTI.ID_UTENTE 
				   WHERE
					  1=1 ${QdateFrom} ${QdateTo} ${Qagente} 
				   group by
					  APPUNTAMENTI.ID_VENDITORE 
				   UNION
				   select
					  VENDITORE.ID_UTENTE,
					  VENDITORE.COGNOME,
					  VENDITORE.NOME,
					  VENDITORE.TIPO,
					  COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS APPUNTAMENTI,
					  SUM(IFNULL(APPUNTAMENTI.NUM_LUCE, 0)) + SUM(IFNULL(APPUNTAMENTI.NUM_GAS, 0)) AS CONTRATTI,
					  ROUND((SUM(IFNULL(APPUNTAMENTI.NUM_LUCE, 0)) + SUM(IFNULL(APPUNTAMENTI.NUM_GAS, 0))) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS PERC_CONTRATTI_O_APPUNTAMENTI,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'OK', 1, null)) AS OK,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'OK', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS OK_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'KO', 1, null)) AS KO,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'KO', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS KO_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'VALUTA', 1, null)) AS VALUTA,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'VALUTA', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS VALUTA_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'ASSENTE', 1, null)) AS ASSENTE,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'ASSENTE', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS ASSENTE_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'NON VISITATO', 1, null)) AS NON_VISITATO,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'NON VISITATO', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS NON_VISITATO_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO IS NULL, 1, null)) AS DA_ESITARE,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO IS NULL, 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS DA_ESITARE_PERC 
				   from
					  APPUNTAMENTI 
					  LEFT JOIN
						 UTENTI VENDITORE 
						 ON APPUNTAMENTI.ID_VENDITORE = VENDITORE.ID_UTENTE 
					  JOIN
						 RESPONSABILI_AGENTI 
						 ON APPUNTAMENTI.ID_VENDITORE = RESPONSABILI_AGENTI.ID_AGENTE 
						 AND RESPONSABILI_AGENTI.DATA_FINE_ASS IS NULL 
					  JOIN
						 SUPERVISORE_RESPONSABILI 
						 ON RESPONSABILI_AGENTI.ID_RESPONSABILE = SUPERVISORE_RESPONSABILI.ID_RESPONSABILE 
						 AND SUPERVISORE_RESPONSABILI.ID_SUPERVISORE =? 
						 AND SUPERVISORE_RESPONSABILI.DATA_FINE_ASS IS NULL 
				   WHERE
					  1=1 ${QdateFrom} ${QdateTo} ${Qagente} 
				   group by
					  APPUNTAMENTI.ID_VENDITORE 
				   UNION
				   select
					  VENDITORE.ID_UTENTE,
					  VENDITORE.COGNOME,
					  VENDITORE.NOME,
					  VENDITORE.TIPO,
					  COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS APPUNTAMENTI,
					  SUM(IFNULL(APPUNTAMENTI.NUM_LUCE, 0)) + SUM(IFNULL(APPUNTAMENTI.NUM_GAS, 0)) AS CONTRATTI,
					  ROUND((SUM(IFNULL(APPUNTAMENTI.NUM_LUCE, 0)) + SUM(IFNULL(APPUNTAMENTI.NUM_GAS, 0))) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS PERC_CONTRATTI_O_APPUNTAMENTI,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'OK', 1, null)) AS OK,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'OK', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS OK_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'KO', 1, null)) AS KO,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'KO', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS KO_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'VALUTA', 1, null)) AS VALUTA,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'VALUTA', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS VALUTA_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'ASSENTE', 1, null)) AS ASSENTE,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'ASSENTE', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS ASSENTE_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'NON VISITATO', 1, null)) AS NON_VISITATO,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'NON VISITATO', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS NON_VISITATO_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO IS NULL, 1, null)) AS DA_ESITARE,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO IS NULL, 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS DA_ESITARE_PERC 
				   from
					  APPUNTAMENTI 
					  LEFT JOIN
						 UTENTI VENDITORE 
						 ON APPUNTAMENTI.ID_VENDITORE = VENDITORE.ID_UTENTE 
					  JOIN
						 SUPERVISORE_RESPONSABILI 
						 ON SUPERVISORE_RESPONSABILI.ID_RESPONSABILE = VENDITORE.ID_UTENTE 
						 AND SUPERVISORE_RESPONSABILI.ID_SUPERVISORE =? 
						 AND SUPERVISORE_RESPONSABILI.DATA_FINE_ASS IS NULL 
				   WHERE
					  1=1 ${QdateFrom} ${QdateTo} ${Qagente} 
				   group by
					  APPUNTAMENTI.ID_VENDITORE 
				   UNION
				   select
					  UTENTI.ID_UTENTE,
					  UTENTI.COGNOME,
					  UTENTI.NOME,
					  UTENTI.TIPO,
					  COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS APPUNTAMENTI,
					  SUM(IFNULL(APPUNTAMENTI.NUM_LUCE, 0)) + SUM(IFNULL(APPUNTAMENTI.NUM_GAS, 0)) AS CONTRATTI,
					  ROUND((SUM(IFNULL(APPUNTAMENTI.NUM_LUCE, 0)) + SUM(IFNULL(APPUNTAMENTI.NUM_GAS, 0))) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS PERC_CONTRATTI_O_APPUNTAMENTI,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'OK', 1, null)) AS OK,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'OK', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS OK_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'KO', 1, null)) AS KO,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'KO', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS KO_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'VALUTA', 1, null)) AS VALUTA,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'VALUTA', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS VALUTA_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'ASSENTE', 1, null)) AS ASSENTE,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'ASSENTE', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS ASSENTE_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'NON VISITATO', 1, null)) AS NON_VISITATO,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'NON VISITATO', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS NON_VISITATO_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO IS NULL, 1, null)) AS DA_ESITARE,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO IS NULL, 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS DA_ESITARE_PERC 
				   from
					  APPUNTAMENTI 
					  inner join
						 RESPONSABILI_AGENTI 
						 ON RESPONSABILI_AGENTI.ID_RESPONSABILE =? 
						 AND RESPONSABILI_AGENTI.ID_AGENTE = APPUNTAMENTI.ID_VENDITORE 
					  left join
						 UTENTI 
						 ON APPUNTAMENTI.ID_OPERATORE = UTENTI.ID_UTENTE 
				   WHERE
					  1=1 ${QdateFrom} ${QdateTo} ${Qagente} 
				   group by
					  APPUNTAMENTI.ID_OPERATORE 
				   UNION
				   select
					  OPERATORE.ID_UTENTE,
					  OPERATORE.COGNOME,
					  OPERATORE.NOME,
					  OPERATORE.TIPO,
					  COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS APPUNTAMENTI,
					  SUM(IFNULL(APPUNTAMENTI.NUM_LUCE, 0)) + SUM(IFNULL(APPUNTAMENTI.NUM_GAS, 0)) AS CONTRATTI,
					  ROUND((SUM(IFNULL(APPUNTAMENTI.NUM_LUCE, 0)) + SUM(IFNULL(APPUNTAMENTI.NUM_GAS, 0))) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS PERC_CONTRATTI_O_APPUNTAMENTI,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'OK', 1, null)) AS OK,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'OK', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS OK_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'KO', 1, null)) AS KO,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'KO', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS KO_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'VALUTA', 1, null)) AS VALUTA,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'VALUTA', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS VALUTA_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'ASSENTE', 1, null)) AS ASSENTE,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'ASSENTE', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS ASSENTE_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'NON VISITATO', 1, null)) AS NON_VISITATO,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'NON VISITATO', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS NON_VISITATO_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO IS NULL, 1, null)) AS DA_ESITARE,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO IS NULL, 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS DA_ESITARE_PERC 
				   from
					  APPUNTAMENTI 
					  LEFT JOIN
						 UTENTI OPERATORE 
						 ON APPUNTAMENTI.ID_OPERATORE = OPERATORE.ID_UTENTE 
					  LEFT JOIN
						 UTENTI VENDITORE 
						 ON APPUNTAMENTI.ID_VENDITORE = VENDITORE.ID_UTENTE 
					  JOIN
						 RESPONSABILI_AGENTI 
						 ON APPUNTAMENTI.ID_VENDITORE = RESPONSABILI_AGENTI.ID_AGENTE 
						 AND RESPONSABILI_AGENTI.DATA_FINE_ASS IS NULL 
					  JOIN
						 SUPERVISORE_RESPONSABILI 
						 ON RESPONSABILI_AGENTI.ID_RESPONSABILE = SUPERVISORE_RESPONSABILI.ID_RESPONSABILE 
						 AND SUPERVISORE_RESPONSABILI.ID_SUPERVISORE=? 
						 AND SUPERVISORE_RESPONSABILI.DATA_FINE_ASS IS NULL 
				   WHERE
					  1=1 ${QdateFrom} ${QdateTo} ${Qagente} 
				   group by
					  APPUNTAMENTI.ID_OPERATORE 
				   UNION
				   select
					  OPERATORE.ID_UTENTE,
					  OPERATORE.COGNOME,
					  OPERATORE.NOME,
					  OPERATORE.TIPO,
					  COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS APPUNTAMENTI,
					  SUM(IFNULL(APPUNTAMENTI.NUM_LUCE, 0)) + SUM(IFNULL(APPUNTAMENTI.NUM_GAS, 0)) AS CONTRATTI,
					  ROUND((SUM(IFNULL(APPUNTAMENTI.NUM_LUCE, 0)) + SUM(IFNULL(APPUNTAMENTI.NUM_GAS, 0))) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS PERC_CONTRATTI_O_APPUNTAMENTI,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'OK', 1, null)) AS OK,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'OK', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS OK_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'KO', 1, null)) AS KO,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'KO', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS KO_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'VALUTA', 1, null)) AS VALUTA,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'VALUTA', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS VALUTA_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'ASSENTE', 1, null)) AS ASSENTE,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'ASSENTE', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS ASSENTE_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO = 'NON VISITATO', 1, null)) AS NON_VISITATO,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO = 'NON VISITATO', 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS NON_VISITATO_PERC,
					  COUNT(IF(APPUNTAMENTI.ESITO IS NULL, 1, null)) AS DA_ESITARE,
					  ROUND(COUNT(IF(APPUNTAMENTI.ESITO IS NULL, 1, null)) / COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) *100, 0) AS DA_ESITARE_PERC 
				   from
					  APPUNTAMENTI 
					  LEFT JOIN
						 UTENTI OPERATORE 
						 ON APPUNTAMENTI.ID_OPERATORE = OPERATORE.ID_UTENTE 
					  LEFT JOIN
						 UTENTI VENDITORE 
						 ON APPUNTAMENTI.ID_VENDITORE = VENDITORE.ID_UTENTE 
					  JOIN
						 SUPERVISORE_RESPONSABILI 
						 ON SUPERVISORE_RESPONSABILI.ID_RESPONSABILE = VENDITORE.ID_UTENTE 
						 AND SUPERVISORE_RESPONSABILI.ID_SUPERVISORE=? 
						 AND SUPERVISORE_RESPONSABILI.DATA_FINE_ASS IS NULL 
				   WHERE
					  1=1 ${QdateFrom} ${QdateTo} ${Qagente} 
				   group by
					  APPUNTAMENTI.ID_OPERATORE ) as tab1 
					   left join (
						  select 
							  APPUNTAMENTI.ID_VENDITORE AS ID_UTENTE_2,
							  COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS OK_PRECEDENTI
							  FROM APPUNTAMENTI
							  inner join
							 RESPONSABILI_AGENTI 
							 ON RESPONSABILI_AGENTI.ID_RESPONSABILE =? 
							 AND RESPONSABILI_AGENTI.ID_AGENTE = APPUNTAMENTI.ID_VENDITORE 
							 left join
							 UTENTI 
							  ON APPUNTAMENTI.ID_VENDITORE = UTENTI.ID_UTENTE 
							  WHERE 1=1  ${Q_dateOK_From} ${Q_dateOK_To} ${Qagente}
							   group by APPUNTAMENTI.ID_VENDITORE
							   
						  UNION
						  
						  select
						  APPUNTAMENTI.ID_VENDITORE AS ID_UTENTE_2,
							  COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS OK_PRECEDENTI
							  FROM APPUNTAMENTI
							  LEFT JOIN
						 UTENTI VENDITORE 
						 ON APPUNTAMENTI.ID_VENDITORE = VENDITORE.ID_UTENTE 
					  JOIN
						 RESPONSABILI_AGENTI 
						 ON APPUNTAMENTI.ID_VENDITORE = RESPONSABILI_AGENTI.ID_AGENTE 
						 AND RESPONSABILI_AGENTI.DATA_FINE_ASS IS NULL 
					  JOIN
						 SUPERVISORE_RESPONSABILI 
						 ON RESPONSABILI_AGENTI.ID_RESPONSABILE = SUPERVISORE_RESPONSABILI.ID_RESPONSABILE 
						 AND SUPERVISORE_RESPONSABILI.ID_SUPERVISORE =? 
						 AND SUPERVISORE_RESPONSABILI.DATA_FINE_ASS IS NULL 
							  WHERE 1=1  ${Q_dateOK_From} ${Q_dateOK_To} ${Qagente}
							   group by APPUNTAMENTI.ID_VENDITORE
							  
								   
						  UNION
						  
						  select	APPUNTAMENTI.ID_VENDITORE AS ID_UTENTE_2,
							  COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS OK_PRECEDENTI
							  FROM APPUNTAMENTI
						  LEFT JOIN
						 UTENTI VENDITORE 
						 ON APPUNTAMENTI.ID_VENDITORE = VENDITORE.ID_UTENTE 
					  JOIN
						 SUPERVISORE_RESPONSABILI 
						 ON SUPERVISORE_RESPONSABILI.ID_RESPONSABILE = VENDITORE.ID_UTENTE 
						 AND SUPERVISORE_RESPONSABILI.ID_SUPERVISORE =? 
						 AND SUPERVISORE_RESPONSABILI.DATA_FINE_ASS IS NULL 	
						 WHERE 1=1  ${Q_dateOK_From} ${Q_dateOK_To} ${Qagente}
							   group by APPUNTAMENTI.ID_VENDITORE
							   
						  UNION	 
						  
						  select	APPUNTAMENTI.ID_OPERATORE AS ID_UTENTE_2,
						  COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS OK_PRECEDENTI
							  FROM APPUNTAMENTI
						  inner join
						 RESPONSABILI_AGENTI 
						 ON RESPONSABILI_AGENTI.ID_RESPONSABILE =? 
						 AND RESPONSABILI_AGENTI.ID_AGENTE = APPUNTAMENTI.ID_VENDITORE 
					  left join
						 UTENTI 
						 ON APPUNTAMENTI.ID_OPERATORE = UTENTI.ID_UTENTE 
						 WHERE 1=1  ${Q_dateOK_From} ${Q_dateOK_To} ${Qagente}
							   group by APPUNTAMENTI.ID_OPERATORE
							   
							   UNION	 
						  
						  select	APPUNTAMENTI.ID_OPERATORE AS ID_UTENTE_2,
						  COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS OK_PRECEDENTI
							  FROM APPUNTAMENTI
						  LEFT JOIN
						 UTENTI OPERATORE 
						 ON APPUNTAMENTI.ID_OPERATORE = OPERATORE.ID_UTENTE 
					  LEFT JOIN
						 UTENTI VENDITORE 
						 ON APPUNTAMENTI.ID_VENDITORE = VENDITORE.ID_UTENTE 
					  JOIN
						 RESPONSABILI_AGENTI 
						 ON APPUNTAMENTI.ID_VENDITORE = RESPONSABILI_AGENTI.ID_AGENTE 
						 AND RESPONSABILI_AGENTI.DATA_FINE_ASS IS NULL 
					  JOIN
						 SUPERVISORE_RESPONSABILI 
						 ON RESPONSABILI_AGENTI.ID_RESPONSABILE = SUPERVISORE_RESPONSABILI.ID_RESPONSABILE 
						 AND SUPERVISORE_RESPONSABILI.ID_SUPERVISORE=? 
						 AND SUPERVISORE_RESPONSABILI.DATA_FINE_ASS IS NULL 
						 WHERE 1=1  ${Q_dateOK_From} ${Q_dateOK_To} ${Qagente}
							   group by APPUNTAMENTI.ID_OPERATORE
							   
							   UNION	 
						  
						  select	APPUNTAMENTI.ID_OPERATORE AS ID_UTENTE_2,
						  COUNT(APPUNTAMENTI.ID_APPUNTAMENTO) AS OK_PRECEDENTI
							  FROM APPUNTAMENTI
						  LEFT JOIN
						 UTENTI OPERATORE 
						 ON APPUNTAMENTI.ID_OPERATORE = OPERATORE.ID_UTENTE 
					  LEFT JOIN
						 UTENTI VENDITORE 
						 ON APPUNTAMENTI.ID_VENDITORE = VENDITORE.ID_UTENTE 
					  JOIN
						 SUPERVISORE_RESPONSABILI 
						 ON SUPERVISORE_RESPONSABILI.ID_RESPONSABILE = VENDITORE.ID_UTENTE 
						 AND SUPERVISORE_RESPONSABILI.ID_SUPERVISORE=? 
						 AND SUPERVISORE_RESPONSABILI.DATA_FINE_ASS IS NULL 
						 WHERE 1=1  ${Q_dateOK_From} ${Q_dateOK_To} ${Qagente}
							   group by APPUNTAMENTI.ID_OPERATORE
							   
					  ) as tab2 on tab1.ID_UTENTE = tab2.ID_UTENTE_2`,
                    [
                        idResponsabile,
                        idResponsabile,
                        idResponsabile,
                        idResponsabile,
                        idResponsabile,
                        idResponsabile,
                        idResponsabile,
                        idResponsabile,
                        idResponsabile,
                        idResponsabile,
                        idResponsabile,
                        idResponsabile
                    ],
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error("ERRORE SQL STATS ADMIN: --> " + err);
                            res.sendStatus(500);
                        } else {
                            if (rows.length !== 0 && !err) {
                                data["stats"] = rows;
                                res.json(data);
                            } else if (rows.length === 0) {
                                //Error code 2 = no rows in db.
                                data["error"] = 2;
                                data["stats"] = "Nessuna statistica trovata";
                                res.status(404).json(data);
                            } else {
                                data["stats"] = "Errore in fase di reperimento utente";
                                res.status(500).json(data);
                                console.log("Errore in fase di reperimento utenti: " + err);
                                log.error("Errore in fase di reperimento utenti: " + err);
                            }
                        }
                    }
                );
            });
        }
    });
});


app.get('/listaAgentiForResponsabile/:id', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var idResponsabile = req.params.id;
            var data = {};
            pool.getConnection(function (err, connection) {
                connection.query(
                    `SELECT UT.* FROM UTENTI AS UT

					JOIN  (SELECT * FROM RESPONSABILI_AGENTI AS RA WHERE RA.ID_RESPONSABILE = ? AND RA.DATA_FINE_ASS IS NULL ) AS T ON UT.ID_UTENTE=T.ID_AGENTE WHERE UT.UTENTE_ATTIVO = 1
				  UNION
					  SELECT UT.* FROM UTENTI AS UT
					  JOIN  (SELECT * FROM SUPERVISORE_RESPONSABILI AS SR WHERE SR.ID_SUPERVISORE = ? AND SR.DATA_FINE_ASS IS NULL ) AS T ON UT.ID_UTENTE=T.ID_RESPONSABILE WHERE UT.UTENTE_ATTIVO = 1
				  UNION
					  SELECT UT.* FROM UTENTI AS UT
					  JOIN  (SELECT RA.* FROM RESPONSABILI_AGENTI AS RA JOIN SUPERVISORE_RESPONSABILI AS SR ON RA.ID_RESPONSABILE=SR.ID_RESPONSABILE   WHERE SR.ID_SUPERVISORE = ? AND RA.DATA_FINE_ASS IS NULL ) AS T 
					  ON UT.ID_UTENTE=T.ID_AGENTE WHERE UT.UTENTE_ATTIVO = 1`, [idResponsabile, idResponsabile, idResponsabile],
                    function (err, rows, fields) {
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
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};
            pool.getConnection(function (err, connection) {
                connection.query('SELECT * from UTENTI where TIPO = "RESPONSABILE_AGENTI" AND UTENTE_ATTIVO = 1 ORDER BY COGNOME ASC', function (err, rows, fields) {
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


//INSERIMENTO RECESSI LUCE
app.post('/insertRecessesLuce', ensureToken, requireAdminOrBackOffice, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};

            var jsonLuce = req.body.jsonLuce;
            if (jsonLuce && jsonLuce.length > 0) {




                pool.getConnection(function (err, connection) {
                    connection.beginTransaction(function (errTrans) {
                        if (errTrans) { //Transaction Error (Rollback and release connection)
                            connection.rollback(function () {
                                connection.release();
                            });
                            res.sendStatus(500);
                        } else {
                            jsonLuce.forEach(recesso => {

                                recesso.DATA_ATTIVAZIONE = new Date(recesso.DATA_ATTIVAZIONE);
                                recesso.DATA_VALIDITA_RECESSO = new Date(recesso.DATA_VALIDITA_RECESSO);

                                recesso.stato = 'ASSEGNATO';

                                if (recesso.VENDITORE_ASSEGNATO === 111111) {
                                    recesso.VENDITORE_ASSEGNATO = null;
                                    recesso.stato = 'NON_GESTIRE';

                                } else if (recesso.VENDITORE_ASSEGNATO === 222222) {
                                    recesso.VENDITORE_ASSEGNATO = null;
                                    recesso.stato = 'NON_ASSOCIATO';
                                } else if (recesso.VENDITORE_ASSEGNATO == null) {
                                    recesso.VENDITORE_ASSEGNATO = null;
                                    recesso.stato = 'ERROR';
                                }

                                connection.query(`INSERT INTO
								recessi_luce (
								  ID_RECESSO_LUCE,
								  POD,
								  CD_TP_UTENZA,
								  INSOLUTO,
								  RAGIONE_SOCIALE,
								  INDIRIZZO_SEDE_LEGALE,
								  LOCALITA_SEDE_LEGALE,
								  INDIRIZZO_FORN,
								  LOCALITA_FORN,
								  TELEFONO,
								  CELLULARE,
								  KWH_ANNUI,
								  DATA_ATTIVAZIONE,
								  DATA_VALIDITA_RECESSO,
								  NOTA_RECESSO,
								  AGENZIA,
								  GRUPPO
								)
							  VALUES
								(
								  NULL,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?
								)`,
                                    [
                                        recesso.POD,
                                        recesso.CD_TP_UTENZA,
                                        recesso.insoluto,
                                        recesso.RAGIONE_SOCIALE,
                                        recesso.INDIRIZZO_SEDE_LEGALE,
                                        recesso.LOCALITA_SEDE_LEGALE,
                                        recesso.INDIRIZZO_FORN,
                                        recesso.LOCALITA_FORN,
                                        recesso.TELEFONO,
                                        recesso.CELLULARE,
                                        recesso.KWH_ANNUI,
                                        recesso.DATA_ATTIVAZIONE,
                                        recesso.DATA_VALIDITA_RECESSO,
                                        recesso.NOTA_RECESSO,
                                        recesso.AGENZIA,
                                        recesso.GRUPPO
                                    ],
                                    function (err, rows, fields) {
                                        if (err) {
                                            // SE IL RECORD è DUPLICATO SKIPPO L'IESIMO ELEMENTO TRAMITE IL return 
                                            if (err.errno == 1062) {
                                                return;
                                            } else {
                                                connection.rollback(function () {
                                                    connection.release();
                                                    //Failure
                                                });
                                                res.sendStatus(500);
                                            }


                                        }
                                        else {
                                            var insertedId = rows.insertId;
                                            connection.query(`INSERT INTO
										dettaglio_recesso_luce (
										  ID_DETTAGLIO_LUCE,
										  ID_RECESSO_LUCE,
										  VENDITORE_ASSEGNATO,
										  DATA_INSERIMENTO,
										  ULTIMA_MODIFICA,
                                          REFERENTE_RECESSO,
                                          REFERENTE_RECESSO_RECAPITO,
                                          STATO,
                                          COD_CONTRATTO
										)
									  VALUES
										(
										  NULL,
										  ?,
										  ?,
										  NOW(),
										  NOW(),
                                          NULL,
                                          NULL,
                                          ?,
                                          NULL
										)`,
                                                [
                                                    insertedId,
                                                    recesso.VENDITORE_ASSEGNATO,
                                                    recesso.stato
                                                ],
                                                function (err, rows, fields) {
                                                    if (err) {
                                                        connection.rollback(function () {
                                                            connection.release();
                                                            //Failure
                                                        });
                                                        res.sendStatus(500);

                                                    }
                                                });


                                        }
                                    });
                            });
                        }

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
                        });

                    });

                });

            } else {
                res.sendStatus(400);
            }

        }
    });
});

//INSERIMENTO RECESSI GAS
app.post('/insertRecessesGas', ensureToken, requireAdminOrBackOffice, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};

            var jsonGas = req.body.jsonGas;
            if (jsonGas && jsonGas.length > 0) {

                pool.getConnection(function (err, connection) {
                    connection.beginTransaction(function (errTrans) {
                        if (errTrans) { //Transaction Error (Rollback and release connection)
                            connection.rollback(function () {
                                connection.release();
                            });
                            res.sendStatus(500);
                        } else {
                            jsonGas.forEach(recesso => {

                                recesso.DATA_INIZIO_FORNITURA = new Date(recesso.DATA_INIZIO_FORNITURA);
                                recesso.DATA_OUT = new Date(recesso.DATA_OUT);

                                recesso.stato = 'ASSEGNATO';

                                if (recesso.VENDITORE_ASSEGNATO === 111111) {
                                    recesso.VENDITORE_ASSEGNATO = null;
                                    recesso.stato = 'NON_GESTIRE';

                                } else if (recesso.VENDITORE_ASSEGNATO === 222222) {
                                    recesso.VENDITORE_ASSEGNATO = null;
                                    recesso.stato = 'NON_ASSOCIATO';
                                } else if (recesso.VENDITORE_ASSEGNATO == null) {
                                    recesso.VENDITORE_ASSEGNATO = null;
                                    recesso.stato = 'ERROR';
                                }

                                connection.query(`INSERT INTO
								recessi_gas (
								  ID_RECESSO_GAS,
								  PDR,
								  DENOMINAZIONE,
								  VIA,
								  LOCALITA,
								  PROVINCIA,
								  CONSUMO_CONTRATTUALE,
								  RIF_TELEFONICI,
								  AGENTE,
								  CAPO_AREA,
								  DATA_INIZIO_FORNITURA,
								  DATA_OUT,
								  OFFERTA
								)
							  VALUES
								(
								  NULL,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?,
								  ?
								  
								)`,
                                    [
                                        recesso.PDR,
                                        recesso.DENOMINAZIONE,
                                        recesso.VIA,
                                        recesso.LOCALITA,
                                        recesso.PROVINCIA,
                                        recesso.CONSUMO_CONTRATTUALE,
                                        recesso.RIF_TELEFONICI,
                                        recesso.AGENTE,
                                        recesso.CAPO_AREA,
                                        recesso.DATA_INIZIO_FORNITURA,
                                        recesso.DATA_OUT,
                                        recesso.OFFERTA
                                    ],
                                    function (err, rows, fields) {
                                        if (err) {
                                            // SE IL RECORD è DUPLICATO SKIPPO L'IESIMO ELEMENTO TRAMITE IL return 
                                            if (err.errno == 1062) {
                                                return;
                                            } else {
                                                connection.rollback(function () {
                                                    connection.release();
                                                    //Failure
                                                });
                                                res.sendStatus(500);
                                            }


                                        } else {
                                            var insertedId = rows.insertId;
                                            connection.query(`INSERT INTO
										dettaglio_recesso_gas (
										  ID_DETTAGLIO_GAS,
										  ID_RECESSO_GAS,
										  VENDITORE_ASSEGNATO,
										  DATA_INSERIMENTO,
										  ULTIMA_MODIFICA,
                                          REFERENTE_RECESSO,
                                          REFERENTE_RECESSO_RECAPITO,
                                          STATO,
                                          COD_CONTRATTO
										)
									  VALUES
										(
										  NULL,
										  ?,
										  ?,
										  NOW(),
										  NOW(),
                                          NULL,
                                          NULL,
                                          ?,
                                          NULL
										)`,
                                                [
                                                    insertedId,
                                                    recesso.VENDITORE_ASSEGNATO,
                                                    recesso.stato
                                                ],
                                                function (err, rows, fields) {
                                                    if (err) {
                                                        connection.rollback(function () {
                                                            connection.release();
                                                            //Failure
                                                        });
                                                        res.sendStatus(500);

                                                    }
                                                });


                                        }
                                    });
                            });
                        }

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
                        });

                    });

                });

            } else {
                res.sendStatus(400);
            }

        }
    });
});

//LISTA RECESSI GAS
app.post('/gasRecessesList', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};

            var limit = req.body.limit;
            //piccolo ANTI HACK
            if (limit > 200) {
                limit = 100;
            }

            var offset = req.body.offset;

            var order = req.body.order;
            var Qorder = " ";
            if (order !== '' && order !== undefined && order != null) {
                Qorder = ' CAST(CONSUMO_CONTRATTUALE AS UNSIGNED) ' + order + ', ';
            }

            var dateFrom = req.body.dataRecessoDAL;
            var QdateFrom = " ";
            if (dateFrom !== '' && dateFrom !== undefined && dateFrom != null) {
                QdateFrom = ' AND DATA_OUT >= "' + dateFrom + '" ';
            }

            var dateTo = req.body.dataRecessoAL;
            var QdateTo = " ";
            if (dateTo !== '' && dateTo !== undefined && dateTo != null) {
                QdateTo = ' AND DATA_OUT <= "' + dateTo + '" ';
            }


            var ragioneSociale = req.body.ragioneSociale;
            var QragioneSociale = " ";
            if (ragioneSociale !== '' && ragioneSociale !== undefined && ragioneSociale != null) {
                QragioneSociale = ' AND LOWER(DENOMINAZIONE) LIKE LOWER("%' + ragioneSociale + '%") ';
            }

            var stato = req.body.stato;
            var Qstato = " ";
            if (stato !== '' && stato !== undefined && stato != null) {

                Qstato = ' AND STATO = "' + stato + '" ';

            } else {
                if (req.body.userType && (req.body.userType == 'AGENTE' || req.body.userType == 'AGENTE_JUNIOR' || req.body.userType == 'RESPONSABILE_AGENTI')) {
                    //DI DEFAULT NON MOSTRO I NON GESTIRE  I RESPINTI e I RIENTRI 
                    Qstato = ' AND STATO != "NON_GESTIRE" AND STATO != "RESPINTO" AND STATO != "RIENTRO" ';
                }
                else {
                    //DI DEFAULT NON MOSTRO I NON GESTIRE  I RESPINTI e I RIENTRI 
                    Qstato = ' AND STATO != "NON_GESTIRE" ';
                }
            }


            var mcAnnui = req.body.mcAnnui;
            var QmcAnnui = " ";
            if (mcAnnui !== '' && mcAnnui !== undefined && mcAnnui != null) {

                if (mcAnnui == '50000') {
                    QmcAnnui = ' AND CONSUMO_CONTRATTUALE > 50000 ';
                } else {
                    var from = mcAnnui.split("-")[0];

                    var to = mcAnnui.split("-")[1];

                    QmcAnnui = ' AND CONSUMO_CONTRATTUALE BETWEEN ' + from + ' AND ' + to + ' ';
                }


            }


            var provincia = req.body.provincia;
            var Qprovincia = " ";
            if (provincia !== '' && provincia !== undefined && provincia != null) {
                Qprovincia = ' AND LOWER(LOCALITA) LIKE LOWER("%(' + provincia + ')%") ';
            }

            var agente = req.body.agente;
            var Qagente = " ";
            if (agente !== '' && agente !== undefined && agente != null) {
                Qagente = ' AND VENDITORE_ASSEGNATO = "' + agente + '" ';
            }



            pool.getConnection(function (err, connection) {
                connection.query(`SELECT COUNT(*) AS TotalCount from recessi_gas as rg inner join dettaglio_recesso_gas as drg on rg.ID_RECESSO_GAS = drg.ID_DETTAGLIO_GAS
                                    where 1=1  ${QdateFrom}  ${QdateTo}  ${Qprovincia}  ${QragioneSociale}  ${Qagente}  ${Qstato} ${QmcAnnui} `,
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL RICERCA COUNT RECESSI GAS ' + err);
                            res.sendStatus(500);
                        } else {

                            data["totaleRecessiGas"] = rows[0].TotalCount;

                            pool.getConnection(function (err, connection) {
                                connection.query(`select 
                                rg.*, drg.*,VENDITORE.ID_UTENTE ID_VENDITORE, VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE 
                                from recessi_gas as rg 
                                inner join dettaglio_recesso_gas as drg on rg.ID_RECESSO_GAS = drg.ID_DETTAGLIO_GAS
                                left join UTENTI VENDITORE ON drg.VENDITORE_ASSEGNATO=VENDITORE.ID_UTENTE 
                                where 1=1 ${QdateFrom}  ${QdateTo}  ${Qprovincia}  ${QragioneSociale}  ${Qagente}  ${Qstato}  ${QmcAnnui}  ORDER BY ${Qorder} DATA_OUT DESC LIMIT ? OFFSET ?`, [limit, offset],
                                    function (err, rows, fields) {
                                        connection.release();
                                        if (err) {
                                            log.error('ERRORE SQL RICERCA recessiGas: --> ' + err);
                                            res.sendStatus(500);
                                        } else {
                                            if (rows.length !== 0) {
                                                data["recessiGas"] = rows;
                                                res.json(data);
                                            } else {
                                                data["recessiGas"] = [];
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

//LISTA RECESSI LUCE
app.post('/luceRecessesList', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};

            var limit = req.body.limit;
            //piccolo ANTI HACK
            if (limit > 200) {
                limit = 100;
            }

            var offset = req.body.offset;

            var order = req.body.order;
            var Qorder = " ";
            if (order !== '' && order !== undefined && order != null) {
                Qorder = ' CAST(KWH_ANNUI AS UNSIGNED) ' + order + ', ';
            }


            var dateFrom = req.body.dataRecessoDAL;
            var QdateFrom = " ";
            if (dateFrom !== '' && dateFrom !== undefined && dateFrom != null) {
                QdateFrom = ' AND DATA_VALIDITA_RECESSO >= "' + dateFrom + '" ';
            }

            var dateTo = req.body.dataRecessoAL;
            var QdateTo = " ";
            if (dateTo !== '' && dateTo !== undefined && dateTo != null) {
                QdateTo = ' AND DATA_VALIDITA_RECESSO <= "' + dateTo + '" ';
            }


            var ragioneSociale = req.body.ragioneSociale;
            var QragioneSociale = " ";
            if (ragioneSociale !== '' && ragioneSociale !== undefined && ragioneSociale != null) {
                QragioneSociale = ' AND LOWER(RAGIONE_SOCIALE) LIKE LOWER("%' + ragioneSociale + '%") ';
            }

            var stato = req.body.stato;
            var Qstato = " ";
            if (stato !== '' && stato !== undefined && stato != null) {

                Qstato = ' AND STATO = "' + stato + '" ';

            } else {
                if (req.body.userType && (req.body.userType == 'AGENTE' || req.body.userType == 'AGENTE_JUNIOR' || req.body.userType == 'RESPONSABILE_AGENTI')) {
                    //DI DEFAULT NON MOSTRO I NON GESTIRE  I RESPINTI e I RIENTRI 
                    Qstato = ' AND STATO != "NON_GESTIRE" AND STATO != "RESPINTO" AND STATO != "RIENTRO" ';
                }
                else {
                    //DI DEFAULT NON MOSTRO I NON GESTIRE  I RESPINTI e I RIENTRI 
                    Qstato = ' AND STATO != "NON_GESTIRE" ';
                }
            }




            var kwhAnnui = req.body.kwhAnnui;
            var QkwhAnnui = " ";
            if (kwhAnnui !== '' && kwhAnnui !== undefined && kwhAnnui != null) {

                if (kwhAnnui == '50000') {
                    QkwhAnnui = ' AND KWH_ANNUI > 50000 ';
                } else {
                    var from = kwhAnnui.split("-")[0];

                    var to = kwhAnnui.split("-")[1];

                    QkwhAnnui = ' AND KWH_ANNUI BETWEEN ' + from + ' AND ' + to + ' ';
                }


            }


            var provincia = req.body.provincia;
            var Qprovincia = " ";
            if (provincia !== '' && provincia !== undefined && provincia != null) {
                Qprovincia = ' AND LOWER(LOCALITA_FORN) LIKE LOWER("%(' + provincia + ')%") ';
            }

            var agente = req.body.agente;
            var Qagente = " ";
            if (agente !== '' && agente !== undefined && agente != null) {
                Qagente = ' AND VENDITORE_ASSEGNATO = "' + agente + '" ';
            }



            pool.getConnection(function (err, connection) {
                connection.query(`SELECT COUNT(*) AS TotalCount from recessi_luce as rl inner join dettaglio_recesso_luce as drl on rl.ID_RECESSO_LUCE = drl.ID_DETTAGLIO_LUCE
                                    where 1=1  ${QdateFrom}  ${QdateTo}  ${Qprovincia}  ${QragioneSociale}  ${Qagente}  ${Qstato} ${QkwhAnnui}  `,
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL RICERCA COUNT RECESSI luce ' + err);
                            res.sendStatus(500);
                        } else {

                            data["totaleRecessiLuce"] = rows[0].TotalCount;

                            pool.getConnection(function (err, connection) {
                                connection.query(`select 
                                rl.*, drl.*, VENDITORE.ID_UTENTE ID_VENDITORE, VENDITORE.NOME NOME_VENDITORE, VENDITORE.COGNOME COGNOME_VENDITORE 
                                from recessi_luce as rl 
                                inner join dettaglio_recesso_luce as drl on rl.ID_RECESSO_LUCE = drl.ID_DETTAGLIO_LUCE
                                left join UTENTI VENDITORE ON drl.VENDITORE_ASSEGNATO=VENDITORE.ID_UTENTE 
                                where 1=1 ${QdateFrom}  ${QdateTo}  ${Qprovincia}  ${QragioneSociale}  ${Qagente}  ${Qstato} ${QkwhAnnui} ORDER BY  ${Qorder} DATA_VALIDITA_RECESSO DESC LIMIT ? OFFSET ?`, [limit, offset],
                                    function (err, rows, fields) {
                                        connection.release();
                                        if (err) {
                                            log.error('ERRORE SQL RICERCA recessiLuce: --> ' + err);
                                            res.sendStatus(500);
                                        } else {
                                            if (rows.length !== 0) {
                                                data["recessiLuce"] = rows;
                                                res.json(data);
                                            } else {
                                                data["recessiLuce"] = [];
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

//DOWNLOAAD RECESSI GAS
app.post('/downloadRecessiGas', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};


            var order = req.body.order;
            var Qorder = " ";
            if (order !== '' && order !== undefined && order != null) {
                Qorder = ' CAST(CONSUMO_CONTRATTUALE AS UNSIGNED) ' + order + ', ';
            }


            var dateFrom = req.body.dataRecessoDAL;
            var QdateFrom = " ";
            if (dateFrom !== '' && dateFrom !== undefined && dateFrom != null) {
                QdateFrom = ' AND DATA_OUT >= "' + dateFrom + '" ';
            }

            var dateTo = req.body.dataRecessoAL;
            var QdateTo = " ";
            if (dateTo !== '' && dateTo !== undefined && dateTo != null) {
                QdateTo = ' AND DATA_OUT <= "' + dateTo + '" ';
            }


            var ragioneSociale = req.body.ragioneSociale;
            var QragioneSociale = " ";
            if (ragioneSociale !== '' && ragioneSociale !== undefined && ragioneSociale != null) {
                QragioneSociale = ' AND LOWER(DENOMINAZIONE) LIKE LOWER("%' + ragioneSociale + '%") ';
            }

            var stato = req.body.stato;
            var Qstato = " ";
            if (stato !== '' && stato !== undefined && stato != null) {

                Qstato = ' AND STATO = "' + stato + '" ';

            } else {
                if (req.body.userType && (req.body.userType == 'AGENTE' || req.body.userType == 'AGENTE_JUNIOR' || req.body.userType == 'RESPONSABILE_AGENTI')) {
                    //DI DEFAULT NON MOSTRO I NON GESTIRE  I RESPINTI e I RIENTRI 
                    Qstato = ' AND STATO != "NON_GESTIRE" AND STATO != "RESPINTO" AND STATO != "RIENTRO" ';
                }
                else {
                    //DI DEFAULT NON MOSTRO I NON GESTIRE  I RESPINTI e I RIENTRI 
                    Qstato = ' AND STATO != "NON_GESTIRE" ';
                }
            }


            var mcAnnui = req.body.mcAnnui;
            var QmcAnnui = " ";
            if (mcAnnui !== '' && mcAnnui !== undefined && mcAnnui != null) {

                if (mcAnnui == '50000') {
                    QmcAnnui = ' AND CONSUMO_CONTRATTUALE > 50000 ';
                } else {
                    var from = mcAnnui.split("-")[0];

                    var to = mcAnnui.split("-")[1];

                    QmcAnnui = ' AND CONSUMO_CONTRATTUALE BETWEEN ' + from + ' AND ' + to + ' ';
                }


            }


            var provincia = req.body.provincia;
            var Qprovincia = " ";
            if (provincia !== '' && provincia !== undefined && provincia != null) {
                Qprovincia = ' AND LOWER(LOCALITA) LIKE LOWER("%(' + provincia + ')%") ';
            }

            var agente = req.body.agente;
            var Qagente = " ";
            if (agente !== '' && agente !== undefined && agente != null) {
                Qagente = ' AND VENDITORE_ASSEGNATO = "' + agente + '" ';
            }

            
            pool.getConnection(function (err, connection) {
                connection.query(`select 
                CONCAT(VENDITORE.COGNOME, " ",  VENDITORE.NOME) AS "Agente", 
                rg.PDR AS "Pdr", 
                CONCAT(rg.VIA, " ",  rg.LOCALITA, " ", rg.PROVINCIA) AS "Indirizzo", 
                rg.DENOMINAZIONE AS "Rag. Sociale", 
                rg.CONSUMO_CONTRATTUALE AS "Metri Cubi Annui", 
                DATE_FORMAT(rg.DATA_OUT,"%d-%m-%y") AS "Data Recesso",
                rg.RIF_TELEFONICI AS "Recapiti", 
                drg.STATO AS "Stato", 
                drg.NOTE AS "Note",  
                CONCAT(drg.REFERENTE_RECESSO, " ",  drg.REFERENTE_RECESSO_RECAPITO) AS "Referente Recesso", 
                drg.COD_CONTRATTO AS "Cod. Contratto" 
                from recessi_gas as rg 
                inner join dettaglio_recesso_gas as drg on rg.ID_RECESSO_GAS = drg.ID_DETTAGLIO_GAS 
                left join UTENTI VENDITORE ON drg.VENDITORE_ASSEGNATO=VENDITORE.ID_UTENTE 
                where 1=1 ${QdateFrom}  ${QdateTo}  ${Qprovincia}  ${QragioneSociale}  ${Qagente}  ${Qstato}  ${QmcAnnui}  ORDER BY ${Qorder} DATA_OUT DESC `, [],
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL DOWNLOAD recessiGas: --> ' + err);
                            res.sendStatus(500);
                        } else {
                            if (rows.length !== 0) {
                                data["recessiGas"] = rows;
                                res.json(data);
                            } else {
                                data["recessiGas"] = [];
                                res.json(data);
                            }
                        }

                    });

            });




        }
    });
});

//DOWNLOAAD RECESSI LUCE
app.post('/downloadRecessiLuce', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var data = {};



            var order = req.body.order;
            var Qorder = " ";
            if (order !== '' && order !== undefined && order != null) {
                Qorder = ' CAST(KWH_ANNUI AS UNSIGNED) ' + order + ', ';
            }


            var dateFrom = req.body.dataRecessoDAL;
            var QdateFrom = " ";
            if (dateFrom !== '' && dateFrom !== undefined && dateFrom != null) {
                QdateFrom = ' AND DATA_VALIDITA_RECESSO >= "' + dateFrom + '" ';
            }

            var dateTo = req.body.dataRecessoAL;
            var QdateTo = " ";
            if (dateTo !== '' && dateTo !== undefined && dateTo != null) {
                QdateTo = ' AND DATA_VALIDITA_RECESSO <= "' + dateTo + '" ';
            }


            var ragioneSociale = req.body.ragioneSociale;
            var QragioneSociale = " ";
            if (ragioneSociale !== '' && ragioneSociale !== undefined && ragioneSociale != null) {
                QragioneSociale = ' AND LOWER(RAGIONE_SOCIALE) LIKE LOWER("%' + ragioneSociale + '%") ';
            }

            var stato = req.body.stato;
            var Qstato = " ";
            if (stato !== '' && stato !== undefined && stato != null) {

                Qstato = ' AND STATO = "' + stato + '" ';

            } else {
                if (req.body.userType && (req.body.userType == 'AGENTE' || req.body.userType == 'AGENTE_JUNIOR' || req.body.userType == 'RESPONSABILE_AGENTI')) {
                    //DI DEFAULT NON MOSTRO I NON GESTIRE  I RESPINTI e I RIENTRI 
                    Qstato = ' AND STATO != "NON_GESTIRE" AND STATO != "RESPINTO" AND STATO != "RIENTRO" ';
                }
                else {
                    //DI DEFAULT NON MOSTRO I NON GESTIRE  I RESPINTI e I RIENTRI 
                    Qstato = ' AND STATO != "NON_GESTIRE" ';
                }
            }




            var kwhAnnui = req.body.kwhAnnui;
            var QkwhAnnui = " ";
            if (kwhAnnui !== '' && kwhAnnui !== undefined && kwhAnnui != null) {

                if (kwhAnnui == '50000') {
                    QkwhAnnui = ' AND KWH_ANNUI > 50000 ';
                } else {
                    var from = kwhAnnui.split("-")[0];

                    var to = kwhAnnui.split("-")[1];

                    QkwhAnnui = ' AND KWH_ANNUI BETWEEN ' + from + ' AND ' + to + ' ';
                }


            }


            var provincia = req.body.provincia;
            var Qprovincia = " ";
            if (provincia !== '' && provincia !== undefined && provincia != null) {
                Qprovincia = ' AND LOWER(LOCALITA_FORN) LIKE LOWER("%(' + provincia + ')%") ';
            }

            var agente = req.body.agente;
            var Qagente = " ";
            if (agente !== '' && agente !== undefined && agente != null) {
                Qagente = ' AND VENDITORE_ASSEGNATO = "' + agente + '" ';
            }



            pool.getConnection(function (err, connection) {
                connection.query(`select 

                CONCAT(VENDITORE.COGNOME, " ",  VENDITORE.NOME) AS "Agente", 
                rl.POD AS "Pod", 
                CONCAT(rl.INDIRIZZO_FORN, " ",  rl.LOCALITA_FORN) AS "Indirizzo", 
                rl.RAGIONE_SOCIALE AS "Rag. Sociale", 
                rl.KWH_ANNUI AS "KWH Annui", 
                rl.INSOLUTO AS "Insoluto", 
                DATE_FORMAT(rl.DATA_VALIDITA_RECESSO, "%d-%m-%y") AS "Data Recesso", 
                CONCAT(rl.TELEFONO, " ",  rl.CELLULARE) AS "Recapiti", 

                drl.STATO AS "Stato", 
                drl.NOTE AS "Note",  
                CONCAT(drl.REFERENTE_RECESSO, " ",  drl.REFERENTE_RECESSO_RECAPITO) AS "Referente Recesso", 
                drl.COD_CONTRATTO AS "Cod. Contratto" 

                from recessi_luce as rl 
                inner join dettaglio_recesso_luce as drl on rl.ID_RECESSO_LUCE = drl.ID_DETTAGLIO_LUCE 
                left join UTENTI VENDITORE ON drl.VENDITORE_ASSEGNATO=VENDITORE.ID_UTENTE 
                where 1=1 ${QdateFrom}  ${QdateTo}  ${Qprovincia}  ${QragioneSociale}  ${Qagente}  ${Qstato} ${QkwhAnnui} ORDER BY  ${Qorder} DATA_VALIDITA_RECESSO DESC `, [],
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL DOWNLOAD recessiLuce: --> ' + err);
                            res.sendStatus(500);
                        } else {
                            if (rows.length !== 0) {
                                data["recessiLuce"] = rows;
                                res.json(data);
                            } else {
                                data["recessiLuce"] = [];
                                res.json(data);
                            }
                        }

                    });

            });




        }
    });
});


//VEFICA PRESENZA RECESSI
app.get('/checkRecessiAgente/:id', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var agente = req.params.id;

            pool.getConnection(function (err, connection) {
                connection.query(`SELECT COUNT(*) AS countRecessiLuce from recessi_luce as rl inner join dettaglio_recesso_luce as drl on rl.ID_RECESSO_LUCE = drl.ID_DETTAGLIO_LUCE where drl.VENDITORE_ASSEGNATO=? `, [agente],
                    function (err, rows, fields) {
                        connection.release();
                        if (err) {
                            log.error('ERRORE SQL RICERCA COUNT RECESSI luce ' + err);
                            res.sendStatus(500);
                        } else {

                            data["countRecessiLuce"] = rows[0].countRecessiLuce;
                            pool.getConnection(function (err, connection) {
                                connection.query(`SELECT COUNT(*) AS countRecessiGas from recessi_gas as rg inner join dettaglio_recesso_gas as drg on rg.ID_RECESSO_GAS = drg.ID_DETTAGLIO_GAS where drg.VENDITORE_ASSEGNATO=?`, [agente],
                                    function (err, rows, fields) {
                                        connection.release();
                                        if (err) {
                                            log.error('ERRORE SQL COUNT RECESSI gas: --> ' + err);
                                            res.sendStatus(500);
                                        } else {
                                            data["countRecessiGas"] = rows[0].countRecessiGas;
                                            res.json(data);
                                        }
                                    });

                            });

                        }
                    });
            });
        }
    });
});

//UPDATE RECESSO LUCE
app.patch('/luceRecess/:id', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var idRecessoLuce = req.params.id;

            var stato = req.body.stato;

            if (stato == '' || stato == undefined || stato == null) {
                stato = null;
            }

            var agente = req.body.agente;

            if (agente == '' || agente == undefined || agente == null) {
                agente = null;
            }

            var refRecesso = req.body.refRecesso;

            if (refRecesso == '' || refRecesso == undefined || refRecesso == null) {
                refRecesso = null;
            }
            var refRecapito = req.body.refRecapito;

            if (refRecapito == '' || refRecapito == undefined || refRecapito == null) {
                refRecapito = null;
            }

            var codContratto = req.body.codContratto;

            if (codContratto == '' || codContratto == undefined || codContratto == null) {
                codContratto = null;
            }
            var note = req.body.note;

            if (note == '' || note == undefined || note == null) {
                note = null;
            }

            if (stato != 'RIENTRO') {
                codContratto = null
            }
            if (stato == 'NON_ASSOCIATO') {
                agente = null;
            }

            pool.getConnection(function (err, connection) {

                connection.beginTransaction(function (errTrans) {
                    if (errTrans) { //Transaction Error (Rollback and release connection)
                        connection.rollback(function () {
                            connection.release();
                        });
                        res.sendStatus(500);
                    } else {

                        connection.query(`UPDATE dettaglio_recesso_luce SET VENDITORE_ASSEGNATO = ?, REFERENTE_RECESSO=?, REFERENTE_RECESSO_RECAPITO=?, STATO=?, COD_CONTRATTO=?, ULTIMA_MODIFICA=NOW(), NOTE=? WHERE ID_DETTAGLIO_LUCE=?`, [agente, refRecesso, refRecapito, stato, codContratto, note, idRecessoLuce],
                            function (err, rows, fields) {
                                if (err) {
                                    connection.rollback(function () {
                                        connection.release();
                                        //Failure
                                    });
                                    res.sendStatus(500);
                                    log.error('ERRORE SQL PATCH recessiLuce: --> ' + err);
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
                                            res.sendStatus(200);
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


//UPDATE RECESSO GAS
app.patch('/gasRecess/:id', ensureToken, function (req, res) {
    jwt.verify(req.token, config.secretKey, function (err, data) {
        if (err) {
            res.sendStatus(403);
        } else {
            var idRecessoGas = req.params.id;



            var stato = req.body.stato;

            if (stato == '' || stato == undefined || stato == null) {
                stato = null;
            }

            var agente = req.body.agente;

            if (agente == '' || agente == undefined || agente == null) {
                agente = null;
            }

            var refRecesso = req.body.refRecesso;

            if (refRecesso == '' || refRecesso == undefined || refRecesso == null) {
                refRecesso = null;
            }
            var refRecapito = req.body.refRecapito;

            if (refRecapito == '' || refRecapito == undefined || refRecapito == null) {
                refRecapito = null;
            }

            var codContratto = req.body.codContratto;

            if (codContratto == '' || codContratto == undefined || codContratto == null) {
                codContratto = null;
            }

            var note = req.body.note;

            if (note == '' || note == undefined || note == null) {
                note = null;
            }

            if (stato != 'RIENTRO') {
                codContratto = null;
            }
            if (stato == 'NON_ASSOCIATO') {
                agente = null;
            }
            pool.getConnection(function (err, connection) {
                connection.beginTransaction(function (errTrans) {
                    if (errTrans) { //Transaction Error (Rollback and release connection)
                        connection.rollback(function () {
                            connection.release();
                        });
                        res.sendStatus(500);
                    } else {

                        connection.query(`UPDATE dettaglio_recesso_gas  SET VENDITORE_ASSEGNATO = ?, REFERENTE_RECESSO=?, REFERENTE_RECESSO_RECAPITO=?, STATO=?, COD_CONTRATTO=?, ULTIMA_MODIFICA=NOW(), NOTE=? WHERE ID_DETTAGLIO_GAS=?`, [agente, refRecesso, refRecapito, stato, codContratto, note, idRecessoGas],
                            function (err, rows, fields) {
                                if (err) {
                                    connection.rollback(function () {
                                        connection.release();
                                        //Failure
                                    });
                                    res.sendStatus(500);
                                    log.error('ERRORE SQL PATCH gasRecess: --> ' + err);
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
                                            res.sendStatus(200);
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





app.all("/*", function (req, res, next) {
    res.sendfile("index.html", {
        root: __dirname + "/public"
    });
});

function requireAdmin(request, response, next) {

    var test = jwt.decode(request.token);
    if (test.role != 'ADMIN') {
        response.sendStatus(403);
    } else {
        next();
    }
}

function requireAdminOrBackOffice(request, response, next) {

    var test = jwt.decode(request.token);
    if (test.role != 'ADMIN' && test.role != 'BACK_OFFICE') {
        response.sendStatus(403);
    } else {
        next();
    }
}

function requireAdminOrResponsabile(request, response, next) {

    var test = jwt.decode(request.token);
    if (test.role != 'ADMIN' && test.role != 'RESPONSABILE_AGENTI') {
        response.sendStatus(403);
    } else {
        next();
    }
}

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


var server = app.listen(config.ServerPort, function () {

    var host = server.address().address;
    var port = server.address().port;
    var env = process.env.NODE_ENV || 'development';
    console.log("dummy app listening at: " + host + ":" + port + " " + env);

})