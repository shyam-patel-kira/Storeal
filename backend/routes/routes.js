import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const algorithm = "aes-256-cbc"; //Using AES encryption
import HashMap from "hashmap";
import fs from "fs";
const hashmapTree = new HashMap();
import * as IPFS from "ipfs-core";

const gCounter = 0;

dotenv.config();

const Router = express.Router();

// get todo route
Router.get('/', (req, res) => {

    console.log("U have reached get !")
    res.send("get")
})

// add todo route
// mark todo as completed route
Router.post('/write', async (req, res) => {
    console.log(req.body[0])
    console.log(req.body[2].address)
    let writeObject = JSON.stringify(req.body[0]);
    let address = req.body[2].address;
    console.log("write Object : ", writeObject);
    let encryptedWriteObject = encrypt(writeObject);
    let uuid = gCounter.toString() + address.toString();
    console.log("key : ", uuid);
    hashmapTree.set(uuid, encryptedWriteObject.iv);
    console.log("encryptred : ", encryptedWriteObject);
    console.log("decrypted : ",decrypt(encryptedWriteObject));
    console.log(hashmapTree.get("00xBe15aC21c67d22979C1fd7c5228C9A05DC19010e"));
    
    const ipfs = await IPFS.create();
    const { cid } = await ipfs.add(encryptedWriteObject.encryptedData);
    console.log("Uploading to IPFS...")
    console.log(cid);
    
    // fs.appendFile('test.json', encryptedWriteObject, function (err) {
    //     if (err) throw err;
    //     console.log('File create!');
    //   });
    
    // fs.unlink('test.json', function (err) {
    //     if (err) throw err;
    //     console.log('File deleted!');
    //   });  
    res.status(200).send("Success!");
    res.json({ "uuid": uuid, "hash": cid });
});

Router.post('/read', async (req, res) => {
    console.log(req.body[0])
    console.log(req.body[2].address)
    let writeObject = JSON.stringify(req.body[0]);
    let address = req.body[2].address;
    console.log("write Object : ", writeObject);
    let encryptedWriteObject = encrypt(writeObject);
    let uuid = gCounter.toString() + address.toString();
    console.log("key : ", uuid);
    hashmapTree.set(uuid, encryptedWriteObject.iv);
    console.log("encryptred : ", encryptedWriteObject);
    console.log("decrypted : ",decrypt(encryptedWriteObject));
    console.log(hashmapTree.get("00xBe15aC21c67d22979C1fd7c5228C9A05DC19010e"));
    
    const ipfs = await IPFS.create();
    const { cid } = await ipfs.add(encryptedWriteObject.encryptedData);
    console.log("Uploading to IPFS...")
    console.log(cid);
    
    // fs.appendFile('test.json', encryptedWriteObject, function (err) {
    //     if (err) throw err;
    //     console.log('File create!');
    //   });
    
    // fs.unlink('test.json', function (err) {
    //     if (err) throw err;
    //     console.log('File deleted!');
    //   });  
    res.status(200).send("Success!");
    res.json({ "uuid": uuid, "hash": cid });
});

//Encrypting text
function encrypt(text) {
   let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
   let encrypted = cipher.update(text);
   encrypted = Buffer.concat([encrypted, cipher.final()]);
   return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

// Decrypting text
function decrypt(text) {
   let iv = Buffer.from(text.iv, 'hex');
   let encryptedText = Buffer.from(text.encryptedData, 'hex');
   let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
   let decrypted = decipher.update(encryptedText);
   decrypted = Buffer.concat([decrypted, decipher.final()]);
   return decrypted.toString();
}

export default Router;