import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import findOrCreate from "mongoose-findorcreate";
import session from "express-session";
import passport from "passport";
import Googlepassport from "passport-google-oauth20";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import dotenv from "dotenv";
dotenv.config();
import { username, password } from "./credentials.js";

import homeRoute from "./routes/home.js";
import clubRoute from "./routes/club.js";
import eventRoute from "./routes/event.js";

const GoogleStrategy = Googlepassport.Strategy;
const app = express();

app.set('view engine', 'ejs');

app.use(cors());
app.use(express.json({ limit: "30mb", extended: true })) 
app.use(express.urlencoded({ limit: "30mb", extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: false,
  }));

app.use(passport.initialize());
app.use(passport.session());

app.use("/home", homeRoute);
app.use("/club",clubRoute);
app.use("/event",eventRoute);

const CONNECTION_URL = `mongodb+srv://${username}:${password}@clubsiiitm.awqoq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const PORT = process.env.PORT || 5000;

mongoose.connect(CONNECTION_URL, { useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => app.listen(PORT, () => console.log(`The server is running on port: ${PORT}`)))
    .catch((error) => console.log(error.message));

const userSchema = new mongoose.Schema({
        googleId: String
});

userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID ,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/club",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      // console.log(profile.emails[0].value);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] ,
  scope:["email"]
}));

app.get("/auth/google/club", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });