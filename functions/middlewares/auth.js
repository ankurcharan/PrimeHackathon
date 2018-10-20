const jwt = require('jsonwebtoken');
const config = require('../config');

const isAuthenticated = function (req, res, next) {

	const token = req.headers.authorization;

	if(token) {

		jwt.verify(token, config.key, (err, data) => {

			if(err) {

				return res.status(401).json({
		        	success: false, 
		        	err: 'unauthenticated request'
		        })
			}

			req.body.name = data.name;
			req.body.sub = data.sub;
			req.body.email = data.email;
			req.body.picture = data.picture;
			req.body.onBoard = data.onBoard;

			if(data.onBoard === true) {
				
				req.body.year = data.year;
				req.body.branch = data.branch;
			}

			return next();
		})
	}
	else {

		return res.status(401).json({
			success: false,
			err: "unauthenticated request"
		})
	}
}

module.exports = isAuthenticated;