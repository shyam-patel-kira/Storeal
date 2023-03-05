const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
//Server Optimisation
const compression = require("compression");
//config file
const dotenv = require("dotenv");
dotenv.config();
// All Routes
const routes = require("./Routes/routes.js");

const Router = express();

Router.use(bodyParser.json());
Router.use(compression());
Router.use(cors());
Router.use(express.json());
Router.use("/x", routes);


Router.use('/', (req, res)=>{
   res.send('<h1> You have reached our middleware. Maybe u r lost. </h1>');
});

Router.listen(6545, () => {
console.log("Up and running! whatever service");
})