const mongoose = require('mongoose');

module.exports = function(req, res, next) {
    mongoose.connect('mongodb://' + process.env.MONGO_HOST + '/chats', {
        useNewUrlParser: true
    }).then(() => {
        next();
    }).catch(err => {
        console.log(err)
        req.send(500, 'Error connecting MongoDB')
    });
};