const express = require("express")
const {
  getPlaceById,
  getPlaceByUserId,
  createPLace,
  updatePlace,
  deletePlace,
} = require("../controllers/places-controllers")
const { check } = require("express-validator")
const fileUpload = require("../middleware/file-upload")
const checkAuth = require("../middleware/check-auth")

const router = express.Router()

//Get a single place by an ID
router.get("/:pid", getPlaceById)

//Get all the places for this user
router.get("/user/:uid", getPlaceByUserId)

router.use(checkAuth)

//Create a new place
router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  createPLace
)

//Patch the Title or de Description of a existing place
router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  updatePlace
)

//Delete a place
router.delete("/:pid", deletePlace)

module.exports = router
