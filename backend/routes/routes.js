const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const crypto = require("crypto");

const HashMap = require("hashmap");
const fs = require("fs");

// const IPFS = require( "ipfs-core";
const axios = require("axios");
const FormData = require("form-data");

const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const algorithm = "aes-256-cbc"; //Using AES encryption

// key - uuid, value - encryption key
const hashmapTree = new HashMap();
// key - uuid, value - set of users
const permissions = new HashMap();
// key - user, value - set of uuid
const alluuid = new HashMap();
let gCounter = 0;

const ethers = require("ethers");
const artifact = require("../../artifacts/contracts/Storeal.sol/Storage.json");

const readCall = async (address) => {
    const privateKey = "0x81438818d904b7f216a570a8fcd2cec21c0fa012d22a061cdd4b4c5526d596dc"
    const rpcProvider = "https://polygon-mumbai.g.alchemy.com/v2/TC73qayvJRryrS2Em9IsHD8farXgc5lk";
    const contractAddress = "0x88DCa61727F991d2C6E7053d7F650283aD01d61D"
    const provider = new ethers.getDefaultProvider(rpcProvider);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, artifact.abi, wallet)
    const tx = await contract.readData(address)
    return tx
}

dotenv.config();

const Router = express.Router();

// add todo route
// mark todo as completed route
Router.post("/write", async (req, res) => {
  console.log(req.body[0]);
  console.log(req.body[2].address);

  let writeObject = JSON.stringify(req.body[0]);
  let address = req.body[2].address;

  console.log("write Object : ", writeObject);

  let encryptedWriteObject = encrypt(writeObject);
  let uuid = gCounter.toString();

  console.log("key : ", uuid);

  hashmapTree.set(uuid, encryptedWriteObject.iv);
  gCounter++;

  console.log("encryptred : ", encryptedWriteObject);
  console.log(hashmapTree.get("00xBe15aC21c67d22979C1fd7c5228C9A05DC19010e"));
  fs.writeFileSync("test.json", encryptedWriteObject.encryptedData, (err) => {
    if (err) {
      console.log("File write err: ", err);
    } else {
      console.log("File write done");
    }
  });
  const form = new FormData();
  form.append("file", fs.readFileSync("test.json"), "test.json");

  const response = await axios.post("http://localhost:5001/api/v0/add?", form, {
    headers: {
      ...form.getHeaders(),
    },
  });
//   console.log(response.data);
//   if (permissions.get(uuid) == undefined){
//     permissions.set(uuid, [address]);
//   }
//     // let users = permissions.get(uuid);
//     // console.log("neww: ", req.body[1].read)
//     permissions.get(uuid).push(req.body[1].read)

//     // permissions.set(uuid, users)
  
//   console.log("perm: ", permissions);

//   console.log("first: ", alluuid.get(address))
//   if (alluuid.get(address) == undefined){
//     console.log("Heyy")
//     let uuidArr = []
//     uuidArr.push(uuid);
//     alluuid.set(address, uuidArr);
//     console.log(alluuid.get(address));
//   } 
//   else {
//     let uuids = alluuid.get(address)
//     uuids.push(uuid)
//     alluuid.set(address, uuid)
//   }
//   if (req.body[1].read.length >= 1){
//     console.log("xx: ", req.body[1].read);
//   }
//   console.log("uuid: ", alluuid)
  
  res.status(200).json({ uuid: uuid, hash: response.data.Hash });
});

Router.get("/read", async (req, resp) => {
    const address = req.body.address;
    readCall(address).then((tx) => {
        console.log(Object.entries(tx).length);
        const arrResp  = [];
        let cnt = 0
        while(cnt < Object.entries(tx).length){
            console.log(Object.entries(tx)[cnt]);
            arrResp.push(Object.entries(tx)[cnt][1][1]);
            cnt++;
        }
        resp.status(200).json({"response": arrResp});
        });
    });

Router.get("/read/:uuid", async (req, resp) => {
    const address = req.body.address;
    readCall(address).then((tx) => {
        console.log("cid: ", tx[0][1]);
        const uuid = req.body.uuid;
        console.log("uuid: ", uuid)
        console.log("map: ", hashmapTree)
        const cid = tx[0][1];

        const url = "http://localhost:5001/api/v0/cat?arg=" + cid;

        axios.post(url).then((res) => {
        console.log("data: ", res.data);
        console.log(
            decrypt({ iv: hashmapTree.get(uuid), encryptedData: res.data })
        );
        resp.status(200).send("done");
        });
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
  let iv = Buffer.from(text.iv, "hex");
  let encryptedText = Buffer.from(text.encryptedData, "hex");
  let decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

module.exports = Router;
