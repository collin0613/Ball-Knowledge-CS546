import express from 'express';
import exphbs from 'express-handlebars';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import configRoutesFunction from './src/routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import MongoStore from 'connect-mongo';
import dotenv from 'dotenv';
import { postOddsBySport } from './src/data/sportsData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
dotenv.config();

// set up static files middleware
app.use('/public', express.static('public'));

//request body parsing middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// cookie parser middleware
app.use(cookieParser());

// session middleware
app.use(
  session({
    name: 'AuthCookie',
    secret: 'BallKnowledge',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 24 * 60 * 60,
    }),
    cookie: {
      maxAge: 60 * 60 * 1000
    }
  })
);

// auth tracking middleware
app.use((req, res, next) => {
  const timestamp = new Date().toUTCString();
  const method = req.method;
  const route = req.originalUrl || req.url;
  
  let authStatus = 'Non-Authenticated User';
  if (req.session.user) {
    authStatus = `Authenticated User (${req.session.user.username})`;
  }
  
  console.log(`[${timestamp}]: ${method} ${route} (${authStatus})`);
  next();
});

// Middleware to make user data available to all templates
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});
app.set('views', path.join(__dirname, 'src', 'views'));
app.engine('handlebars', exphbs.engine({
  defaultLayout: 'main', 
  partialsDir: [path.join(__dirname, 'src', 'views', 'profile')],
  helpers: {
    ifEquals: function(arg1, arg2, options) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    },
  }
}));
app.set('view engine', 'handlebars');


configRoutesFunction(app);


app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log('Your routes will be running on http://localhost:3000');
});