import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import Grid from "gridfs-stream";
import {GridFsStorage} from "multer-gridfs-storage";
import multer from "multer";
import path from "path";
import crypto from "crypto";

import { Types } from "mongoose";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended:true}));

const mongoURI = "mongodb+srv://admin-joseph:olisa312@cluster0.zyfjc1a.mongodb.net/mongouploads";

const conn = mongoose.createConnection(mongoURI);
let gfs;

conn.once('open', function () {
    // gfs = Grid(conn.db, mongoose.mongo);
    gfs = new mongoose.mongo.GridFSBucket(conn.db, { //Note
        bucketName: "uploads"
    });
});

const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
});

const upload = multer({storage});


app.get("/", async (req, res) => {
    try{
        const files = await conn.db.collection('uploads.files').find().toArray(); // Note
        if(!files || files.length === 0){
            res.render("index.ejs", {files: false});
        }
        else{
            files.map(file => {
                if(file.contentType === "image/jpeg" || file.contentType === "image/png"){
                    file.isImage = true;
                }
                else{
                    file.isImage = false;
                }
            });
            res.render("index.ejs", {files: files});
        }
        // res.render("index.ejs", {files: false})
    }catch(err){
        res.status(404).json({err: err.message});
    }
});

app.post("/upload", upload.single('file'), (req, res) => {
    console.log(req.file);
    res.redirect("/");
    
});

app.get("/files", async (req,res) => {
    try{
        const files = await conn.db.collection('uploads.files').find().toArray();
        if(!files || files.length === 0){
            res.json({error: "No files found"});
        }
        else{
            res.json({files});
        }
    }catch(err){
        res.status(404).json({err: err.message});
    }
});

app.get("/files/:filename", async (req,res) => {
    try{
        const file = await gfs.find({filename: req.params.filename}).toArray(); //Note
        if(!file || file.length === 0){
            res.json({error: "No file found"});
        }
        else{
            res.json({File: file});
        }
    }catch(err){
        res.status(404).send({Error: err.message});
    }
});

app.get("/image/:filename", async (req,res) => {
    try{
        const file = await gfs.find({filename: req.params.filename}).toArray();
        if(!file || file.length === 0){
            res.json({error: "No file found"});
        }
        else{
            if(file[0].contentType == "image/jpeg" || file[0].contentType == "image/png"){
                const readstream = gfs.openDownloadStreamByName(req.params.filename);
                readstream.pipe(res);
            }
            else{
                res.json({NotImage: "Not an image"});
            }
        }
    }catch(err){
        res.status(404).send({Error: err.message});
    }
});

app.post("/files/:fileId", async (req,res) => {
    try{
        const ObjectId = mongoose.Types.ObjectId; // Note
        await gfs.delete(new ObjectId(req.params.fileId));//Note
        console.log('successfully deleted');
        res.redirect("/");
    }catch(err){
        res.status(404).json({error: err.message});
    }
});

app.listen(port, ()=>{
    console.log(`Server running from port ${port}`);
});