const jwt = require('jsonwebtoken');
const secretKey = require('../config').secretKey;

const auth = {
    isLogged : async function(req,res,next){
        await jwt.verify(req.token,secretKey,function(err,data){
            if(!err){
                next();
            }else{
                res.sendStatus(403);
            }
               
        })
    }
    
}

module.exports = auth;