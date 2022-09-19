const express = require('express'),
    path = require('path'),
    nodeMailer = require('nodemailer'),
    bodyParser = require('body-parser');


// const cookieParser = require("cookie-parser");
let encodeUrl = bodyParser.urlencoded({ extended: false });
const sessions = require('express-session');
const http = require('http');
const mysql = require('mysql');
const { encode } = require('punycode');
const cookieParser = require("cookie-parser");


//database working
const con = mysql.createConnection({
    host: "localhost",
    user: "root", // my username
    password: "password", // my password
    database: "reg"
});


//handler ejs
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const port = process.env.PORT || 5000 ;


//landing page
app.get('/', function (req, res) {
    res.render('index');
});


//after mail login page
app.get('/login', function (req, res) {
    res.render('log');
});


//session
app.use(sessions({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


//mailing
app.post('/send-email',encodeUrl, function (req, res) {
    let transporter = nodeMailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: 'prnjl39@gmail.com',
            pass: 'ghyzfbrhubxgxjrc'
        }
    });
    let mailOptions = {
        from: '"PJ The Mailer" <xx@gmail.com>', // sender address
        to: req.body.Email, // list of receivers
        subject: req.body.subject, // Subject line
        text: req.body.body, // plain text body
        // html: '<b><a>Click Here to verify your Email</a></b>'
        html: '<p>To login please - <a href="http://localhost:' + port + '/login">Click Here</a></p>' // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);

        //sql connection stuff
        var firstName = req.body.uName;
        var userName = req.body.Email;
        var password = req.body.psw;
    
        con.connect(function (err) {
            if (err) {
                console.log(err);
            };
            // checking user already registered or no
            con.query(`SELECT * FROM users WHERE email = '${userName}' AND password  = '${password}'`, function (err, result) {
                if (err) {
                    console.log(err);
                };
                if (Object.keys(result).length > 0) {
                    res.sendFile(__dirname + '/failReg.html');
                } else {
                    //creating user page in userPage function
                    function userPage() {
                        // We create a session for the dashboard (user page) page and save the user data to this session:
                        req.session.user = {
                            firstname: firstName,
                            username: userName,
                            password: password
                        };
                    }
                    // inserting new user data
                    var sql = `INSERT INTO users (name,email, password) VALUES ('${firstName}','${userName}', '${password}')`;
                    con.query(sql, function (err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            // using userPage function for creating user page
                            userPage();
                        };
                    });
    
                }
    
            });
        });
        res.render('index');
    });
});


//port listening
app.listen(port, function () {
    console.log('Server is running at port: ', port);
});


//session-cookie
// const session = require("express-session");
// const cookieParser = require("cookie-parser");
// app.use(cookieParser());
// app.use(session({
//     secret: "pj1234", saveUninitialized: true, cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
//     resave: false
// }));


//rendering to success page
console.log(process.env);
app.route("/success")
    .get((req, res) => {
        res.render('success', { port: port });
    })
    .post((req, res) => {
        // req.session.user = user.userName;
        // req.session.save();
        return res.redirect('/success');
    });


//user session
app.get("/user", (req, res) => {
    const sessionUser = req.session.user;
    return res.send(sessionUser);
});


//logout page
app.get("/log", (req, res) => {
    req.session.destroy();
    return res.render('logout', { port: port });
});


//login page database
app.post('/auth', function(request, response) {
	// Capture the input fields
	let username = request.body.email;
	let password = request.body.pwd;
	// Ensure the input fields exists and are not empty
	if (username && password) {
		// Execute SQL query that'll select the account from the database based on the specified username and password
		con.query('SELECT * FROM users WHERE email = ? AND password = ?', [username, password], function(error, results, fields) {
			// If there is an issue with the query, output the error
			if (error) throw error;
			// If the account exists
			if (results.length > 0) {
				// Authenticate the user
				request.session.loggedin = true;
				request.session.username = username;
				// Redirect to home page
				response.redirect('/home');
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('<h6>Please enter Username and Password!</h6>');
		response.end();
	}
});


// http://localhost:3000/home
app.get('/home', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		response.send('Welcome , ' + request.session.username + '!'+'<p>Please click here to:- <a href="http://localhost:'+port+'/success">Log Out</a></p>');
	} else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	response.end();
});




