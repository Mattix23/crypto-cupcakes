require("dotenv").config(".env");
const cors = require("cors");
const express = require("express");
const app = express();
const morgan = require("morgan");
const { PORT = 3000 } = process.env;
const { auth } = require("express-openid-connect");
const jwt = require('jsonwebtoken');
const {JWT_SECRET} = process.env;
// TODO - require express-openid-connect and destructure auth from it

const { User, Cupcake } = require("./db");

// middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* *********** YOUR CODE HERE *********** */
// follow the module instructions: destructure config environment variables from process.env
// follow the docs:
// define the config object
// attach Auth0 OIDC auth router
// create a GET / route handler that sends back Logged in or Logged out


const {
  AUTH0_SECRET, // generate one by using: `openssl rand -base64 32`
  AUTH0_AUDIENCE,
  AUTH0_CLIENT_ID,
  AUTH0_BASE_URL,
} = process.env;

const config = {
  authRequired: true, // this is different from the documentation
  auth0Logout: true,
  secret: AUTH0_SECRET,
  baseURL: AUTH0_AUDIENCE,
  clientID: AUTH0_CLIENT_ID,
  issuerBaseURL: AUTH0_BASE_URL,
};

app.use(auth(config));

app.use(async (req, res, next) => {
  const [user] = await User.findOrCreate({
    where: {
      username: req.oidc.user.nickname,
      name: req.oidc.user.name,
      email: req.oidc.user.email,
    }
  });
  console.log(user)
  next();
});

app.get("/", (req, res) => {
  console.log(req.oidc.user);
  res.send(req.oidc.isAuthenticated() ? 
  `<h2 style="text-align: center;">Crypto Cupcakes, Inc.</h2>
  <h1>Welcome ${req.oidc.user.name}</h1>
  <h2><i>Username: ${req.oidc.user.nickname}</i></h2>
  <h3>Email: ${req.oidc.user.email}</h3>
  <img src=${req.oidc.user.picture}>`  : "Logged out");
});
app.get("/cupcakes", async (req, res, next) => {
  try {
    const cupcakes = await Cupcake.findAll();
    res.send(cupcakes);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.get("/me", async (req,res) => {
  const user = await User.findOne({
    where: {
      username: req.oidc.user.nickname
    },
    raw: true,
  })

  if(user) {
    const token = jwt.sign(user, JWT_SECRET, {expiresIn: '1w'});
    res.send({user, token})
  } else{
    res.status(401).send("User not found");
    next();
  }
});
// error handling middleware
app.use((error, req, res, next) => {
  console.error("SERVER ERROR: ", error);
  if (res.statusCode < 400) res.status(500);
  res.send({ error: error.message, name: error.name, message: error.message });
});

app.listen(PORT, () => {
  console.log(`Cupcakes are ready at http://localhost:${PORT}`);
});
