let token = JSON.parse(localStorage.getItem('token'));

// console.log(token);

$('#submitButton').click(function() {

    let year = $('#yearSelect').val();
    let branch = $('#branchSelect').val();

    console.log(year, branch);

    $.ajax({
        url: "https://us-central1-primehackathon.cloudfunctions.net/api/onBoard",
        type: "PUT",
        data: {
            "year": year,
            "branch": branch
        },
        headers: {
            "Authorization": token,
            "Content-Type": 'application/x-www-form-urlencoded',
            "charset": "utf-8"
        },
        success: function(result, status) {

            if(status === 'success') {

                console.log(result);
                if(result.success === true) {

                    localStorage.setItem('token', JSON.stringify(result.data.token));
                    
                    window.location.href = './index.html';
                }                
                
            }
        },
        error: function(err) {
            
            if(err.status === 405) {
                alert("Already OnBoard")
            }
        }

    })

})