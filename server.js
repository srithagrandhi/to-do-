const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();

// -----------------------------------------------------------
// PASTE YOUR MONGODB LINK HERE
// -----------------------------------------------------------
const mongoURI = "mongodb+srv://admin:password1234@cluster0.wxt4zg7.mongodb.net/?appName=Cluster0";
mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.log(err));

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session Configuration (Keeps user logged in)
app.use(session({
    secret: 'my secret key',
    resave: false,
    saveUninitialized: false
}));

// Schemas
const UserSchema = new mongoose.Schema({ 
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const TaskSchema = new mongoose.Schema({ 
    name: String,
    owner: String 
});

const User = mongoose.model('User', UserSchema);
const Task = mongoose.model('Task', TaskSchema);

// Middleware to check login
const requireLogin = (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login');
    }
    next();
};

// --- ROUTES ---

// 1. Register Page
app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        await User.create({ username, password });
        res.redirect('/login');
    } catch (e) {
        res.send("Username already taken. Try again.");
    }
});

// 2. Login Page
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) {
        req.session.user_id = user._id; 
        req.session.username = user.username;
        res.redirect('/');
    } else {
        res.send("Wrong username or password.");
    }
});

// 3. Main Task Page (Protected, no Logout button)
app.get('/', requireLogin, async (req, res) => {
    const tasks = await Task.find({ owner: req.session.username });
    res.render('index', { tasks });
});

app.post('/add', requireLogin, async (req, res) => {
    await Task.create({ 
        name: req.body.taskName,
        owner: req.session.username 
    });
    res.redirect('/');
});

app.post('/delete', requireLogin, async (req, res) => {
    await Task.findByIdAndDelete(req.body.taskId);
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));