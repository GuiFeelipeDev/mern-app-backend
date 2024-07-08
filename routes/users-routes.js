const express = require("express")
const { getUsers, signup, login } = require("../controllers/users-controllers")
const { check } = require("express-validator")
const fileUpload = require("../middleware/file-upload")

const router = express.Router()

//Getting the user data
router.get("/", getUsers)

//Post a new user
router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  signup
)

//Login a userE
router.post("/login", login)

module.exports = router
