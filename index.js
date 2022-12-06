if(process.env.NODE_ENV!== "production"){
    require('dotenv').config()
}
const multer = require("multer");
const {storage} = require("./cloudinary")
const upload = multer({storage})
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const Novel = require("./models/novel");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const User = require('./models/user');
const Apperror = require("./AppError");
const flash = require('connect-flash');
const catchAsync = require("./utils/catchAsync.js");
const ExpressError = require("./utils/ExpressError");
const {validateNovel} = require("./schemas");
const {cloudinary} = require('./cloudinary');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const MongoDBStore = require('connect-mongo')(session);
////////////////////////////////////////////////////////////////////////////
// process.env.DB_URL ||
const dbUrl =  process.env.DB_URL || 'mongodb://localhost:27017/novel-app';
mongoose.connect(dbUrl,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("database connected");
});

//////////////////////////////////////////////////////////////////////////////////


const app = express();
app.engine("ejs", ejsMate);
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const store = new MongoDBStore({
    url: dbUrl,
    secret: 'esgjbvhauhsjkgnvbasdjhbv',
    touchAfter: 24 * 60 * 60
})

store.on('error', function(e){
    console.log('Store Error',e)
})

const sessionConfig = {
    store,
    secret: 'anjfsndkvkdsjvbsd',
    resave: false,
    saveuninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 24 * 7,
        
        
    }
}

app.use(flash());

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

const isLoggedIn = (req,res,next) => {
    if(!req.isAuthenticated()){
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'you must be signed in');
        return res.redirect('/login');
    }
next();
}


const isAuthor = async (req,res,next) => {
    const {id} = req.params;
    const novel = await Novel.findById(id);    

    if(!novel.author.equals(req.user._id)){
        req.flash('error', "permission Denied! You don't own this post");
       return req.redirect(`/novels/${id}`);
        }
        next();
}

app.get("/home", (req, res) => {
    res.render("pages/home");
})



app.get("/novels", catchAsync(async (req,res,next) => {
    const novels = await Novel.find({}).populate('author');

    res.render("pages/index", {novels})
}))




app.get("/novels/new", isLoggedIn, (req,res) => {
    res.render("pages/new");
})



app.post("/novels", isLoggedIn, upload.array('image'),  catchAsync(async (req,res,next) => {
  
  
    const novel = new Novel(req.body.novel);
    novel.author = req.user._id;
    console.log(req.user._id, novel.author);
    for(let f of req.files){

       novel.images.push({url: f.path, filename: f.filename, mimetype: f.mimetype})
    }
    await novel.save()
    req.flash('success', 'successfully added a new novel')
    res.redirect(`/novels/${novel._id}`)
}))


app.get("/novels/:id", catchAsync(async (req,res,next) =>{
   
    const novel = await Novel.findById(req.params.id).populate('author');
    if(!novel){
        req.flash('error', 'novel not found');
        return res.redirect('/novels');
    }
    let pdfurl = '';
    let imageurl = '';
    for (let i of novel.images){
            if(i.mimetype=== 'application/pdf')    
        {
            pdfurl = i.url;
        }
        else{
                 imageurl = i.url;
        }
    }
    // imageurl = imageurl.replace('/upload', '/upload/w_200')

    res.render("pages/show", {novel,pdfurl,imageurl});
}))




app.get("/novels/:id/edit", isLoggedIn, isAuthor, catchAsync(async (req,res,next) => {
    const novel = await Novel.findById(req.params.id);
    if(!novel){
        req.flash('error', 'novel not found');
        return res.redirect('/novels');
    }
    res.render('pages/edit', {novel});
}))




app.put("/novels/:id", isLoggedIn, isAuthor, upload.array('image'), catchAsync(async (req,res,next) => {
    const {id} = req.params;
    const novel = await Novel.findById(id);
    
    if(!novel)
    {
        req.flash('error', 'novel not available');
        return req.redirect('/novels');
    }
    

    if(!novel.author.equals(req.user._id)){
        req.flash('error', "permission Denied! You don't own this post");
       return req.redirect('/novels');
        }
        const nov = await Novel.findByIdAndUpdate(id, {...req.body.novel});
    const imgs = [];

    for(let f of req.files){

    imgs.push({url: f.path, filename: f.filename, mimetype: f.mimetype});
    }
    for (let image of novel.images){
        await cloudinary.uploader.destroy(image.filename);
    }
    novel.images.push(...imgs);
    await novel.save()
    req.flash('success', 'successfully updated the novel')
    res.redirect(`/novels/${novel._id}`)
}))



app.delete("/novels/:id", isLoggedIn, isAuthor, catchAsync( async(req,res,next) => {

    const novel = await Novel.findById(req.params.id);
    
    if(!novel)
    {
        req.flash('error', 'novel not available');
        return req.redirect('/novels');
    }
    
    if(!novel.author.equals(req.user._id)){
        req.flash('error', "permission Denied! You don't own this post");
        req.redirect('/novels');
        }
    for (let image of novel.images){
        await cloudinary.uploader.destroy(image.filename);
    } 
    await Novel.findByIdAndDelete(req.params.id);
    req.flash('success', 'successfully deleted review')
    res.redirect("/novels")
}))




app.get('/register', (req,res,next) => {
    res.render("pages/users/register");
})

app.post('/register', async(req,res, next)=> {
    try{ 
    const {email, username, password} = req.body;
    const user = new User({email, username});
    const registeredUser = await User.register(user,password);
    req.login(registeredUser, err => {
        if(err) return next(err);
        req.flash('success', 'welcome to the BookClub');
        return res.redirect('/novels');
    })
    
}catch(e){
    req.flash('error', 'please retry');
    res.redirect('/register')
}

})


app.get('/login', (req,res,next) => {
    res.render("pages/users/login");
})

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login'}),async(req,res)=> {
    req.flash('success', 'welcome back');
    const redirectUrl = req.session.returnTo || '/novels';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})

app.get('/logout', (req,res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/novels');
      });
})



app.all("*", (req,res,next) => {
    next(new ExpressError('Page Not Found', 404))
})



app.use((err,req,res,next) => {
    const {statusCode = 500, message} = err;
    if(!err.message) err.message = "Page Not Found"
    res.status(statusCode).render('error',{err})
})  


///////////////////////////////////////////////////////////////////////////////////////////////////
app.listen(3000, () => {console.log("listening")})


