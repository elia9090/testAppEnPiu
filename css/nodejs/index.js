const express = require('express');
const app = express();
var helmet = require('helmet');


function checkAuth (req, res, next) {
	console.log('check autorizzazione ' + req.url);

	// don't serve /secure to those not logged in
	// you should add to this list, for each and every secure url
	if (!req.session || !req.session.authenticated) {
		res.render('Utente non autorizzato', { status: 403 });
		return;
	}

	next();
}

app.configure(function () {
    app.use(helmet());
    app.use(express.session({ secret: 'secretTest' }));
    app.use(express.bodyParser());
    app.use(checkAuth);
});

require('service.js')(app);

app.listen(8080, function() {
    console.log('listening on 8080')
})