var util = require('util');

module.exports = function (app) {


	app.post('/authorizazion', function (req, res, next) {

		// CAMBIARE CON LA QUERY SELECT * FROM UTENTI WHERE USER E PASS = REQ.UESER E REQ. PASS
		if (1==1) {
			req.session.authenticated = true;
            res.redirect(__dirname + "/views/dashboard.html");
            //ADD QUERY PARAMETERS FOR USER
		} else {
			req.flash('errore', 'Nome utente o password sbagliati');
			res.redirect(__dirname + "/views/login.html");
		}

	});

	app.get('/logout', function (req, res, next) {
		delete req.session.authenticated;
		res.redirect('/');
	});

};