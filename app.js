const express = require("express")
const fs = require("fs")
const bodyParser = require("body-parser")

require("dotenv").config()

const placesRoutes = require("./routes/places-routes")
const usersRoutes = require("./routes/users-routes")
const HttpError = require("./models/http-error")
const { default: mongoose } = require("mongoose")
const path = require("path")

const app = express()

app.use(bodyParser.json())

app.use("/uploads/images", express.static(path.join("uploads", "images")))

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  )
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE")

  next()
})

app.use("/api/places", placesRoutes)
app.use("/api/users", usersRoutes)

app.use((req, res, next) => {
  throw new HttpError("Could not find this route.", 404)
})

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err)
    })
  }

  if (res.headerSent) return next(error)

  res
    .status(error.code || 500)
    .json({ message: error.message || "An unknown error ocurred!" })
})

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.81lugfw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`
  )
  .then(() => app.listen(process.env.PORT || 5000))
  .catch((err) => console.log(err))
