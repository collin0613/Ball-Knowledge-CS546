import express from 'express';
import exphbs from 'express-handlebars';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import configRoutesFunction from './src/routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { postOddsBySport } from './src/data/sportsData.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

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
    cookie: {
      maxAge: 60 * 60 * 1000 // 1 hour in milliseconds
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
app.engine('handlebars', exphbs.engine({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

configRoutesFunction(app);


app.listen(3000, () => {
  console.log("We've now got a server!");
  console.log('Your routes will be running on http://localhost:3000');
});