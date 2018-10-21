// alert("Connected!");

// import jwt_decode from 'jwt-decode';
let token = JSON.parse(localStorage.getItem('token'));
// var decoded = jwt_decode(token);
// console.log(decoded);


function signOut() {
    // onSignIn();
	var auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function () {
		console.log('User signed out.');
		window.location.href = './index.html';
	});
}

function onLoad() {
    gapi.load('auth2', function() {
      gapi.auth2.init();
    });
  }

function fun()
{
    alert("User Logged Out Succesfully");
    window.location.href = './index.html';   
}

$("#getTechStack").click(function () {

    // console.log("techstack");
    $("#myProjects").hide();
    $("#myBlogs").hide();
    $("#techStack").show();

    $.ajax({
        url: "https://us-central1-primehackathon.cloudfunctions.net/api/user/techstack",
        type: "GET",
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', token);
        },
        success: function(result,status){
            if(status==="success") {
                console.log(result);
                let str = "<ul> ";
                let data = result["data"]["techStack"];
                // console.log(data);
                for(let stack in data)
                {   
                    // console.log(data[stack]);
                    str+= "<li> "+data[stack]["techName"]+" : "+data[stack]["level"]+" </li>";
                }
                str+="</ul>";
                console.log(str);
                $("#techStack").html(str);

            }
        },
        error: function(){
            console.log("error");
        }
    })
    
})

$("#getBlogs").click(function () {

    // console.log("techstack");
    $("#myProjects").hide();
    $("#myBlogs").show();
    $("#techStack").hide();

    $.ajax({
        url: "https://us-central1-primehackathon.cloudfunctions.net/api/user/blogs",
        type: "GET",
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', token);
        },
        success: function(result,status){
            if(status==="success") {
                console.log(result);
                let str = "<ul> ";
                let data = result["data"]["blogs"];
                // // console.log(data);
                for(let stack in data)
                {   
                //     // console.log(data[stack]);
                let idName = "blog"+stack;
                    str+= "<li class='blogTitle' id="+idName+"> "+data[stack]["title"]+"<div id="+idName+" ><p> + "+data[stack]["text"]+" </p></div></li>";
                }
                str+="</ul>";
                console.log(str);
                $("#myBlogs").html(str);

            }
        },
        error: function(){
            console.log("error");
        }
    })
    
})

$("#getProjects").click(function () {

    console.log("techstack");
    $("#myProjects").show();
    $("#myBlogs").hide();
    $("#techStack").hide();
    
})
