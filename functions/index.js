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



// Hard-Coded Strings
const googleUrl = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=';
const users = 'users';
const techStacks = "techStack";
const projectsStack = "projectStack";


// ROUTES

//cors
app.use(cors({origin: true}));

// authentication
app.post('/login', googleLogin);
app.put('/onBoard', isAuthenticated, onBoard);
// techStack
app.post('/user/techstack', isAuthenticated, addTechStack);
app.get('/user/techstack',isAuthenticated,getTechStack);
//projectStack
app.post('/user/projects', isAuthenticated, addProjects);




// database constant
const usersCollection = db.collection(users);


app.use('/', function (req, res) {

	res.send("use another route");

})



// to add user projects

// raw json in body
//
// {
// 	"projects": [
// 		{
// 			"projectTitle": "Bridge",
// 			"projectDescription": "A bridge between the retailer and the online commerce.",
// 			"projectRepo": "https://github.com/ankurcharan/Bridge",
// 			"references":[
// 				{
// 					"link": "www.udemy.com",
// 					"remark": "free online courses"
// 				},
// 				{
// 					"link": "www.youtube.com",
// 					"remark": "best video platform"
// 				}
				
// 			],
// 			"status": "Completed",
// 			"techStack": ["Firebase Functions", "NodeJS", "Javascript", "CSS"]
// 		},
// 		{
// 			"projectTitle": "Stack-Shetra",
// 			"projectDescription": "Internet discussion form for college students",
// 			"projectRepo": "https://github.com/ankurcharan/HackPrime",
// 			"references":[
// 				{
// 					"link": "www.udemy.com",
// 					"remark": "free online courses"
// 				},
// 				{
// 					"link": "www.youtube.com",
// 					"remark": "best video platform"
// 				}
				
// 			],
// 			"status": "Ongoing",
// 			"techStack": ["Firestore", "NodeJS", "JS", "HTML"]
// 		}
// 	]
// }


function addProjects(req, res) {

	let sub = req.body.sub;

	let projectStack = usersCollection.doc(sub).collection(projectsStack);

	let projects = req.body.projects;

	let promises = [];

	for(let project in projects) {
		// console.log(projects[project]);

		let title = projects[project]["projectTitle"].toLowerCase();

		let x = projectStack.doc(title).set(projects[project]);
		// console.log();

		promises.push(x);
	}

	Promise.all(promises)
	.then(() => {

		return res.status(200).json({
			success: true,
			message: "projects added succesfully"
		})
	})
	.catch((err) => {

		return res.status(500).json({
			success: false,
			message: "could not add projects",
			err: err
		})
	})
	
}




// to add techStack of the user
// params
// jwt token in headers
// 
// raw json in body
//
// {
// 	"stack": [
		
// 		{
// 			"techName": "Java",
// 			"level": "BeGinNer"
// 		},
// 		{
// 			"techName": "Java",
// 			"level": "BeGinNer"
// 		}
			
// 	]
// }
function addTechStack(req, res) {

	let sub = req.body.sub;
	let techStack = usersCollection.doc(sub).collection(techStacks);

	let stacks = req.body.stack;
	let promises = [];

	for(let stack in stacks) {

		stacks[stack]["level"] = stacks[stack]["level"].toLowerCase();

		let techName = stacks[stack]["techName"].toLowerCase();
		let x = techStack.doc(techName).set(stacks[stack],{ merge: true });

		promises.push(x);
	}


	Promise.all(promises)
	.then(() => {
		return res.status(200).json({
			success: true,
			message: "techStack added succesfully"
		})
	})
	.catch((err) => {
		return res.status(500).json({
			success: false,
			message: "could not add techStack",
			err: err
		})
	})
}
function getTechStack(req,res){
  
	let sub = req.body.sub;
	let techStack = usersCollection.doc(sub).collection(techStacks);

    let promises = [];
    let techStackData = [];

    let x = techStack.get()
    .then(function(querySnapshot) {

        querySnapshot.forEach(function(doc) {
            // doc.data() is never undefined for query doc snapshots
            console.log(doc.id, " => ", doc.data());
            techStackData.push(doc.data());
        });
        return res.status(200).json({
            success:true,
            data: {
                techStack: techStackData
            }
        })
    })
    .catch((err) => {
        return res.status(500).json({
            success:false,
            message: "Could not get techstack",
            err:err
        })

    })

    // promises.push(x);


    // Promise.all(promises)
	// .then(() => {
	// 	return res.status(200).json(data
	// 	)
	// })
	// .catch((err) => {
	// 	return res.status(500).json({
	// 		success: false,
	// 		message: "could not add techStack",
	// 		err: err
	// 	})
	// })
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