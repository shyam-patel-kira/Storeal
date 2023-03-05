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
import axios from "axios";
import FormData from "form-data";

let gCounter = 0;

dotenv.config();

const Router = express.Router();

// get todo route
// Router.get("/", (req, res) => {
//   console.log("U have reached get !");
//   res.send("get");
// });

// add todo route
// mark todo as completed route
Router.post("/write", async (req, res) => {
  console.log(req.body[0]);
  console.log(req.body[2].address);

  let writeObject = JSON.stringify(req.body[0]);
  let address = req.body[2].address;

  console.log("write Object : ", writeObject);

  let encryptedWriteObject = encrypt(writeObject);
  let uuid = gCounter.toString() + address.toString();

  console.log("key : ", uuid);

  hashmapTree.set(uuid, encryptedWriteObject.iv);
  gCounter++;

  console.log("encryptred : ", encryptedWriteObject);
//   console.log("decrypted : ", decrypt(encryptedWriteObject));
  console.log(hashmapTree.get("00xBe15aC21c67d22979C1fd7c5228C9A05DC19010e"));
  fs.writeFileSync("test.json", encryptedWriteObject.encryptedData, (err) => {
    if(err){
        console.log("File write err: ", err);
    }
    else {
        console.log("File write done");
    }
  })
  const form = new FormData();
//   fs.openSync(test.json, 'w');
//   fs.closeSync(fs.openSync("test.json", 'w'));
  form.append("file", fs.readFileSync("test.json"), "test.json");

  const response = await axios.post(
    'http://localhost:5001/api/v0/add?',
    form,
    {
        headers: {
            ...form.getHeaders()
        }
    }
    );
    console.log(response.data);

    // fs.unlink("test.json", (err => {
    //     if (err) console.log(err);
    //   }));



//   const ipfs = await IPFS.create();
//   const { cid } = await ipfs.add(encryptedWriteObject.encryptedData);
//   console.log("Uploading to IPFS...");
//   console.log(cid);

  res.status(200).json({ uuid: uuid, hash: response.data.Hash });
});

Router.get("/read", async (req, resp) => {
  const uuid = req.body.uuid;
  console.log("uuid: ", uuid)
  console.log("map: ", hashmapTree)
  const cid = req.body.cid;

  const url = "http://localhost:5001/api/v0/cat?arg=" + cid;

  axios.post(url).then((res) => {
    console.log(res.data);
    console.log(
      decrypt({ iv: hashmapTree.get(uuid), encryptedData: res.data })
    );
    resp.status(200).send("done");
  });
});

//Encrypting text
function encrypt(text) {
  let cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString("hex"), encryptedData: encrypted.toString("hex") };
}

// Decrypting text
function decrypt(text) {
    console.log("1: ", text)
  let iv = Buffer.from(text.iv, "hex");
  console.log("2")
  let encryptedText = Buffer.from(text.encryptedData, "hex");
  console.log("3")
  let decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
  console.log("4")
  let decrypted = decipher.update(encryptedText);
  console.log("5")
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export default Router;
