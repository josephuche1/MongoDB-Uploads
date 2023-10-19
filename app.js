import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import Grid from "gridfs-stream";
import {GridFsStorage} from "multer-gridfs-storage";
import multer from "multer";
import path from "path";
import crypto from "crypto";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended:true}));

const mongoURI = "mongodb+srv://admin-joseph:olisa312@cluster0.zyfjc1a.mongodb.net/mongouploads";

const conn = mongoose.createConnection(mongoURI);
let gfs;

conn.once('open', function () {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection(`uploads`);
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


app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.post("/upload", upload.single('file'), (req, res) => {
    console.log(req.body);
    res.json({file: req.file});
});

app.listen(port, ()=>{
    console.log(`Server running from port ${port}`);
});