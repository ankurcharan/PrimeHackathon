const admin = require('firebase-admin');
const functions = require('firebase-functions');
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const config = require('../config');

const db = admin.firestore();

const app = express();
app.use(bodyParser.urlencoded({extended:false}));



// Hard-Coded Strings
const googleUrl = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=';
const users = 'users';
const techStacks = "techStack";
const projectsStack = "projectStack";
const blogs = "blogs";


// database constant
const usersCollection = db.collection(users);


// techStack
app.post('/techstack', addTechStack);
app.get('/techstack', getTechStack);
// blogs
app.post('/blogs', addBlog);
app.post('/blogs', getBlogs);
// projects
app.post('/projects', addProjects);




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
	let projects = req.body.projects;
	let promises = [];

	for(let project in projects) {

		// console.log(projects[project].projectTitle);
		// console.log();
		// console.log();
		// console.log("------------");
		// console.log("------------");

		let references = projects[project].references;
		let techStacks = projects[project].techStack;

		delete projects[project].references;
		delete projects[project].techStack;

		let title = projects[project]["projectTitle"].toLowerCase();
		// console.log(projects[project]);
		let projectStack = usersCollection.doc(sub).collection(projectsStack);

		let y = projectStack.doc(title).set(projects[project])
		.then(() => {

			// projectStack.doc(title).set(projects[project]);
			for(let ref in references) {
				
				let x = projectStack.doc(title).collection("references").add(references[ref]);
				console.log(references[ref]);

				promises.push(x);
			}

			for(let tech in techStacks) {

				console.log(techStacks[tech]);
				let x = projectStack.doc(title).collection("technologies").add({
					"tech": techStacks[tech]
				});

				promises.push(x);
			}

			return;
		})
		.catch(() => {

			return res.status(500).json({
				success: false,
				message: "error adding project"
			})
		})

		promises.push(y);
	}

	Promise.all(promises)
	.then(() => {

		return res.status(200).json({
			success: true,
			message: "projects added successfully"
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






// get all the blogs of a user
// for him to see all his blogs

// send 
// token in headers
// get all blogs of that user
// if use has no blogs 
// returns empty array
function getBlogs(req, res) {

	let sub = req.body.sub;

	usersCollection.doc(sub).collection(blogs).get()
	.then((snapshot) => {

		let data = {
			blogs: []
		}

		snapshot.forEach((doc) => {

			// console.log(doc.id, '>=', doc.data());
			
			let blog = doc.data();

			data["blogs"].push(blog);
		})

		return res.status(200).json({

			success: true,
			data: data
		})
	})
	.catch((err) => {

		return res.status(500).json({
			success: false,
			message: "could not fetch user blogs",
			err: err
		})

	})



}



// to add blogs for a user
//
// token in header
//
// raw json body
// {
// 	"blog": {
		
// 		"title": "My Blog 3",
// 		"text": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
// 	}
// }
function addBlog(req, res) {

	let sub = req.body.sub;

	console.log(req.body);

	let myBlog = req.body.blog;

	usersCollection.doc(sub).collection(blogs).add(myBlog)
	.then(() => {

		return res.status(200).json({
			success: true,
			message: "blog added successfully"
		})
	})
	.catch((err) => {

		return res.status(500).json({
			success: false,
			message: "could not add blog. Try Again!",
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
			message: "techStack added successfully"
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


//getTechStack

// Response

// {
//     "success": true,
//     "data": {
//         "techStack": [
//             {
//                 "techName": "ImageProcessing",
//                 "level": "intermediate"
//             },
//             {
//                 "techName": "Java",
//                 "level": "beginner"
//             },
//             {
//                 "techName": "Python",
//                 "level": "intermediate"
//             }
//         ]
//     }
// }
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


module.exports = app;