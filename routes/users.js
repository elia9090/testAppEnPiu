const router = require('express').Router();

router.post('/user', function(req, res, next){
    return res.json({user: 'user.toAuthJSON()'});
  });

  module.exports = router;