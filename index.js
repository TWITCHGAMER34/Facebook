//This is the main file for the project and contains all the routes and middleware for the project.
// It also contains the models for the project.
// It also contains the code for the nodemailer and the code for the file upload.
// It also contains the code for the auth middleware.
// It also contains the code for the session.
// It also contains the code for the connection to the database.
// It also contains the code for the bcrypt.


const express = require('express'); // Express
const app = express(); // Express
const port = 3000; // Port
const session = require('express-session'); // Session
const ejs = require('ejs'); // EJS
const nodeMailer = require('nodemailer'); // Nodemailer
const bcrypt = require('bcrypt'); // Bcrypt
const mongoose = require('mongoose'); // Mongoose
const cookieParser = require('cookie-parser'); // Cookie parser
const multer = require('multer'); // Multer
const FileStore = require('session-file-store')(session); // Store sessions in a file

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/slutprojekt') // Connect to MongoDB
    .then(() => console.log('MongoDB Connected...')) // If connection is successful
    .catch(err => console.log(err)); // Connect to MongoDB

// Models
const User = module.exports = mongoose.model('User', new mongoose.Schema({ // Create a model for users
    txt: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    pswd: {
        type: String,
        required: true,
    },
    img: {
        type: String,
        required: false,
    }
}));

const Posts = module.exports = mongoose.model('Posts', new mongoose.Schema({ // Create a model for posts
    user_id: String,
    img: {
        type: String, // Type
        required: false, // Required
    }, title: { // Title
        type: String, // Type
        required: true, // Required
    },
}));


// Middleware
app.use(express.static('public')); // Static files
app.use(express.urlencoded({extended: true})); // Body parser
app.use(express.json()); // Body parser
app.use(cookieParser()); // Cookie parser
app.use(session({ // Session
    store: new FileStore({path: './sessions'}), // Store sessions in a file
    resave: false, // Don't save session if unmodified
    saveUninitialized: true, // Save new sessions
    secret: "secret"    // Secret for signing the session ID cookie
}));
app.set('view engine', 'ejs'); // Set view engine to ejs
const transport = nodeMailer.createTransport({ // Create a transport
    service: 'gmail', // Use gmail
    port: 587, // Port
    secure: false, // Use TLS
    auth: { // Auth
        user: 'nazoma05@gmail.com', // Email
        pass: 'oeheyijzazxeqnzl', // Password
    },
});

transport.verify(function (error, success) { // Verify connection
    if (error) { // If error
        console.log(error); // Log error
    } else { // If success
        console.log("Server is ready to take our messages"); // Log success
    }
});

const storage = multer.diskStorage({ // Multer storage
    destination: function (req, file, cb) { // Destination
        cb(null, './public/uploads') // Destination
    },
    filename: function (req, file, cb) { // Filename
        let ogName = file.originalname.split(".").at(-1) // Get original name
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) // Create unique suffix
        cb(null, `${file.fieldname}-${uniqueSuffix}.${ogName}`) // Set filename
    }
})

const upload = multer({storage: storage}) // Multer upload

function auth(req, res, next) { // Auth middleware
    if (req.session.user !== undefined) { // If user is logged in
        next(); // Continue
    } else { // If user is not logged in
        res.redirect('/'); // Redirect to login
    }
}


// Routes
app.get('/', (req, res) => { // Login
    res.render('register'); // Render register
});
app.get('/home', auth, (req, res) => { // Home
    Posts.find({}, async (err, posts) => { // Find all posts
            if (err) { // If error
                console.log(err); // Log error
            } else { // If no error
                console.log(posts) // Log posts
                const promises = [] // Create an array of promises
                for (let i = 0; i < posts.length; i++) { // Loop through posts
                    promises.push(() => new Promise(async (resolve, reject) => { // Push a promise to the array
                        const user = await User.findById(posts[i].user_id); // Find user
                        posts[i].user = user; // Add user to post
                        resolve(); // Resolve promise
                    }))
                }
                await Promise.all(promises.map(p => p())) // Wait for all promises to resolve
                res.render('home', {posts: posts, user: req.session.user}); // Render home

            }
        }
    );
});

app.get('/validate', (req, res) => { // Validate
    res.render('validate'); // Render validate
});

app.get('/profile', auth, async (req, res) => { // Profile
    const user = await User.findById(req.session.user._id); // Find user
    const posts = await Posts.find({user_id: req.session.user._id}); // Find posts
    res.render('profile', {user, posts}); // Render profile
});

app.get('/poptions', auth, (req, res) => { // Profile options
    res.render('poptions', {user: req.session.user}); // Render poptions
});

app.get("/upload", auth, (req, res) => { // Upload
    res.render("upload", {user: req.session.user}); // Render upload
});

app.get('/logout', (req, res) => { // Logout
    req.session.destroy(); // Destroy session
    res.redirect("/")   // Redirect to login
});

app.get('/edit/:id', auth, async (req, res) => { // Edit post
    const post = await Posts.findById(req.params.id); // Find post
    res.render('edit', {post, user: req.session.user}); // Render edit
});

//C.r.u.d.
app.post('/upload', [auth, upload.single('file')], async (req, res) => { // Upload post
    let img = "/public/uploads/" + req.file.filename; // Get image
    const {title} = req.body; // Get title
    await Posts.create({user_id: req.session.user._id, img, title}); // Create post
    res.redirect("/home") // Redirect to home
});

app.post('/register', async (req, res) => { // Register
    const {txt, email, pswd} = req.body; // Get form data
    User.findOne({txt}, (err, user) => { // Find user
        if (err) { // If error
            console.log(err); // Log error
        } else if (user) { // If user exists
            res.send('User already exists'); // If user exists
        } else { // If user doesn't exist
            const hash = bcrypt.hashSync(pswd, 12); // Hash password
            const newUser = new User({ // Create new user
                txt, // Set username
                email, // Set email
                pswd: hash, // Set password to hashed password
            });
            newUser.save((err) => { // Save user
                if (err) { // If error
                    console.log(err); // Log error
                } else { // If success
                    req.session.user = newUser; // Set session
                    res.redirect('/validate'); // Redirect to validate
                    const mailOptions = { // Mail options
                        from: '"Facebook 2.0" <from@example.com>', // Sender
                        to: email, // Receiver
                        subject: 'Verification', // Subject
                        html: '<b>Hey there! </b><br> Click on the link to verify your account: <a href="http://192.168.250.117:3000/">Verify</a>' // HTML
                    };
                    console.log("sending mail"); // Log sending mail
                    transport.sendMail(mailOptions, (error, info) => { // Send mail
                        if (error) return console.log(error); // Log error
                        console.log('Message sent: %s', info.messageId); // Log message id
                    });
                }
            });
        }
    });
});

app.post("/login", (req, res) => { // Login
    if (req.session.user !== undefined) return res.redirect("/home"); // If user is logged in, redirect to home
    const {email, pswd} = req.body; // Get email and password
    if (email.length > 0 && pswd.length > 0) { // If email and password are not empty
        User.findOne({email}, (err, data) => { // Find user
            if (err) { // If error
                console.log(err); // Log error
                res.render("/register"); // Redirect to register
            } else if (data) { // If user is found
                if (bcrypt.compareSync(pswd, data.pswd)) { // If password is correct
                    req.session.user = data; // Set session user
                    req.session.save() // Save session
                    res.redirect('/home'); // Redirect to home
                } else { // If password is incorrect
                    res.status(401).render("error2"); // If password is incorrect
                }
            } else {
                res.status(404).render("error") // If user is not found
            }
        })
    } else res.redirect("/register"); // If email or password is empty, redirect to register
})

//c.r.U.d
app.post("/changeUsername", (req, res) => { // Change username
    const {newUsername} = req.body; // Get new username
    User.findOne({txt: newUsername}, (err, data) => { // Find user
        if (err) { // If error
            console.log(err); // Log error
        } else if (data) { // If username is taken
            res.send("Username already exists"); // If username is taken
        } else { // If username is available
            User.findByIdAndUpdate(req.session.user._id, {txt: newUsername}, (err) => { // Update username
                if (err) { // If error
                    console.log(err); // Log error
                } else { // If no error
                    req.session.user.username = newUsername; // Update session user
                    res.redirect("/profile"); // Redirect to profile
                }
            });
        }
    })
});

app.post("/changeEmail", (req, res) => { // Change email
    const {newEmail} = req.body; // Get new email
    User.findByIdAndUpdate(req.session.user._id, {email: newEmail}, (err) => { // Update email
        if (err) { // If error
            console.log(err); // Log error
        } else { // If no error
            req.session.user.email = newEmail; // Update session user
            res.redirect("/profile"); // Redirect to profile
        }
    });
});

app.post("/changePassword", auth, async (req, res) => { // Change password
    const {password, password2, cpswd} = req.body; // Get new password, new password confirmation and old password
    if (password === password2) {   // If passwords are the same
        User.findById(req.session.user._id, (err, data) => { // Find user
            if (err) return res.redirect("/poptions") // If error, redirect to poptions
            const flag = bcrypt.compareSync(data.pswd, cpswd) // Check if old password is correct
            if (flag) { // If old password is correct
                const hash = bcrypt.hashSync(password, 12); // Hash new password
                User.findOneAndUpdate({id: req.session.user.id}, {pswd: hash}, (err) => { // Update password
                    if (err) { // If error
                        console.log(err); // Log error
                    } else { // If no error
                        return res.redirect("/Profile"); // Redirect to profile
                    }
                });
            } else { // If old password is wrong
                res.render("poptions", {
                    user: req.session.user, // If old password is wrong
                    error: "Old password wrong" // Send error
                });
            }
        })
    } else { // If passwords do not match
        res.render("poptions", { // If passwords do not match
            user: req.session.user, // Send user
            error: "Passwords do not match" // Send error
        });
    }
});

app.post('/profile/:id', [auth, upload.single('avatar')], async (req, res) => { // Upload avatar
    const {txt} = req.body; // Get username
    let img = "/public/uploads/" + req.file.filename; // Image
    await User.findByIdAndUpdate(req.params.id, {img}); // Update user image
    req.session.user.img = img; // Set session user image
    req.session.save() // Save session
    res.redirect("/profile") // Redirect to profile
});

app.post('/post-edit', [auth, upload.single('file')], async (req, res) => {// Edit post
    const {title, id} = req.body;// Get title and id
    let img;// Image
    if (req.file !== undefined) {// If image is uploaded
        img = "/public/uploads/" + req.file.filename;// Upload image
    }
    await Posts.findByIdAndUpdate(id, {img, title});// Update post
    res.redirect("/home") // Redirect to home
});


//c.r.u.D
app.post("/delete", (req, res) => { // Delete user
    User.findByIdAndDelete(req.session.user._id, (err) => { //  Delete user
        if (err) { // If error
            console.log(err); // Log error
        } else { // If no error
            req.session.destroy(); // Destroy session
            res.redirect("/"); // Delete user
        }
    })
});

app.post("/post-delete", (req, res) => {
        Posts.findByIdAndDelete(req.body.id, (err) => { // Delete post
            if (err) {
                console.log(err); // If error
            } else {
                res.redirect("/home"); // Redirect to home
            }
        })
    }
);

//Listening
app.listen(port, () => { // Listen on port
    console.log(`Server running on http://localhost:${port}`); // Log server running
});

