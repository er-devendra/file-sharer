require("dotenv").config()
const multer = require("multer")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const File = require("./models/File")

const express = require("express")
const app = express()
app.use(express.urlencoded({ extended: true }))

const upload = multer({ dest: "uploads" })

const url ="mongodb+srv://devendra:Dev9450208417@cluster0.vh3kpfi.mongodb.net/?retryWrites=true&w=majority"

const connectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true 
}
mongoose.connect(url,connectionParams)
    .then( () => {
        console.log('Connected to database ')
    })
    .catch( (err) => {
        console.error(`Error connecting to the database. \n${err}`);
    })


app.set("view engine", "ejs")

app.get("/", (req, res) => {
  res.render("index")
})

app.post("/upload", upload.single("file"), async (req, res) => {
  const fileData = {
    path: req.file.path,
    originalName: req.file.originalname,
  }
  if (req.body.password != null && req.body.password !== "") {
    fileData.password = await bcrypt.hash(req.body.password, 10)
  }

  const file = await File.create(fileData)

  res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` })
})

app.route("/file/:id").get(handleDownload).post(handleDownload)

async function handleDownload(req, res) {
  const file = await File.findById(req.params.id)

  if (file.password != null) {
    if (req.body.password == null) {
      res.render("password")
      return
    }

    if (!(await bcrypt.compare(req.body.password, file.password))) {
      res.render("password", { error: true })
      return
    }
  }

  file.downloadCount++
  await file.save()

  res.download(file.path, file.originalName)
}

app.listen(process.env.PORT || 5000)