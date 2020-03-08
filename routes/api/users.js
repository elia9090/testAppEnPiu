const router = require('express').Router();
const auth = require('../auth');

router.post('/login', async function(req, res, next){
    const user = await userController.login;
});

module.exports = router;