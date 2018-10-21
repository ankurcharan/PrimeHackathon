const admin = require('firebase-admin');
const functions = require('firebase-functions');
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const config = require('./config');
const isAuthenticated = require('./middlewares/auth');

admin.initializeApp(functions.config().firebase);

const db = admin.firestore();
db.settings({timestampsInSnapshots:true});

const app = express();
app.use(bodyParser.urlencoded({extended:false}));

const userRoutes = require('./routes/user');




// Hard-Coded Strings
const googleUrl = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=';
const users = 'users';
const techStacks = "techStack";
const projectsStack = "projectStack";
const blogs = "blogs";


// database constant
const usersCollection = db.collection(users);


// ROUTES
//cors
app.use(cors({origin: true}));
// origin
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// authentication
app.post('/login', googleLogin);
app.put('/login/onBoard', isAuthenticated, onBoard);

// user routes - techstack, blogs
app.use('/user', isAuthenticated, userRoutes);

app.get('/getTechUsers', getTechStackUsers);

app.use('/', function (req, res) {

	res.send("use another route");

})

// to get all the users with same technology experience
// 
// GET
// send 
// tech = techName in params
function getTechStackUsers(req, res) {

	let tech = req.query.tech;


	if(tech === undefined) {

		return res.status(400).json({
			success: false,
			message: "Usage: [GET] tech=technologyName"
		})
	}

	let promises = [];
	let techUsers = [];

	usersCollection.get()
	.then((docs) => {

		docs.forEach((doc) => {
			let x = usersCollection.doc(doc.id).collection(techStacks).get()
			.then((technologies) => {

				if(technologies !== undefined && technologies !== null) {
					
					technologies.forEach((techno) => {
			
						if(techno.id === tech) {

							techUsers.push(doc.data());
						}
					})
				}

				return;
			})
			.catch((err) => {
				return res.status(500).json({
					success: false,
					message: "error fetching tech",
					err: err
				})
			})

			promises.push(x);
		
		})

		return Promise.all(promises)
		.then(() => {
			return res.status(200).json({
				success: true,
				data: {
					techUsers
				}
			})
		})
		.catch((err) => {
			return res.status(500).json({
				success: false,
				message: "promises not fulfilled",
				err: err 
			})
		})
	})
	.catch((err) => {
	
		return res.status(500).json({
			success: false,
			message: "error fetching users",
			err: err
		})
	})

	
}



function googleLogin(req, response) {

	let idToken = req.body.idToken;
	if(idToken === undefined) {

		return res.status(400).json({
			success: false,
			message: "Usage: [POST] idToken=token"
		})
	}

	request(googleUrl + idToken, {json: true}, (err, res, body) => {

		if(err) {
			// not acceptable
			return response.status(406).json({
				success: false,
				message: "could not make request to google",
				err: err
			})
		}

		console.log(body);

		if(body.error_description !== undefined) {

			return response.status(400).json({
				message: "empty/invalid token",
				error: 'unauthenticated request',
				success: false,
			})
		}

		let sub = body.sub;
		let name = body.name;
		let email = body.email;
		let picture = body.picture;

		console.log(sub, name, email, picture);

		usersCollection.doc(body.sub).get()
		.then((snapshot) => {
			// console.log(snapshot.data());

			if(snapshot.data() === undefined) {

				let userData = {
					name: name,
					sub: sub,
					email: email,
					picture: picture,
					onBoard: false
				}

				usersCollection.doc(sub).set(userData);

				const token = jwt.sign(userData, config.key);

				let data = {
					token: token
				};

				return response.status(200).json({
					success: true,
					onBoard: false,
					data: data
				})
			}
			else {

				// console.log("user exits");
				// console.log(snapshot.data());

				let userData = {
					name: snapshot.data().name,
					sub: snapshot.data().sub,
					email: snapshot.data().email,
					picture: snapshot.data().picture,
					onBoard: snapshot.data().onBoard
				}

				if(snapshot.data().onBoard === true) {

					userData.year = snapshot.data().year;
					userData.branch = snapshot.data().branch;
					// userData.phoneNo = snapshot.data().phoneNo;
				}

				const token = jwt.sign(userData, config.key);

				let data = {
					token: token
				};

				return response.status(200).json({
					success: true,
					onBoard: snapshot.data().onBoard,
					data: data
				})
			}
		})
		.catch((err) => {

			return response.status(500).json({
				success: false,
				message: "could not fetch user data",
				err: err
			})

		})
	})
}

function onBoard(req, res) {

	console.log(req.body);

	let sub = req.body.sub;

	let year = req.body.year;
	let branch = req.body.branch;

	if(year === undefined || branch === undefined) {

		return res.status(400).json({
			success: false,
			message: "Usage: [PUT] year=year&branch=CS"
		})
	}

	usersCollection.doc(sub).get()
	.then((snapshot) => {

		if(snapshot.data() === undefined) {
			// user does not exist
			return res.status(403).json({
				success: false,
				message: "user does not exist"
			})
		}

		let userData = snapshot.data();

		if(userData.onBoard === false) {

			usersCollection.doc(sub).update({
				year: year,
				branch: branch,
				onBoard: true
			})

			let userData = {
				name: snapshot.data().name,
				sub: snapshot.data().sub,
				email: snapshot.data().email,
				picture: snapshot.data().picture,
				onBoard: true,
				year: year,
				branch: branch
			}

			console.log(userData);

			const token = jwt.sign(userData, config.key);

			let data = {
				token
			};

			return res.status(200).json({
				success: true,
				onBoard: true,
				message: "user onBoard now",
				data: data
			})
		}
		else {

			return res.status(405).json({
				success: false,
				message: "not allowed, already onBoard"
			})
		}
	})
	.catch((err) => {

		return res.status(500).json({
			success: false,
			message: "could not fetch user",
			err: err
		})
	})
}


exports.api = functions.https.onRequest(app);