import express from "express";
import bodyParser from "body-parser";
import path from "path";
import cors from "cors";
//Server Optimisation
import compression from "compression";
//config file
import dotenv from "dotenv";
dotenv.config();
// All Routes
import routes from "./Routes/routes.js";

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