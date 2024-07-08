const fs = require("fs")

const HttpError = require("../models/http-error")
const { validationResult } = require("express-validator")
const getCoordsForAddress = require("../util/location")
const Place = require("../models/place")
const User = require("../models/user")
const { default: mongoose } = require("mongoose")

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid
  let place

  try {
    place = await Place.findById(placeId)
  } catch (error) {
    return next(new HttpError("Something went wrong!", 500))
  }

  if (!place) {
    return next(new HttpError("Could not find a place.", 404))
  }

  res.json({ place: place.toObject({ getters: true }) })
}

const getPlaceByUserId = async (req, res, next) => {
  const userId = req.params.uid
  let places

  try {
    places = await Place.find({ creator: userId })
  } catch (error) {
    return next(new HttpError("Something went wrong!", 500))
  }

  if (!places[0]) {
    return next(new HttpError("Could not find a place with this user id.", 404))
  }

  res.json({ places: places.map((item) => item.toObject({ getters: true })) })
}

const createPLace = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty())
    return next(new HttpError("Invalid inputs, please verify the fields.", 422))

  const { title, description, address } = req.body

  let coordinates
  try {
    coordinates = await getCoordsForAddress(address)
  } catch (error) {
    return next(error)
  }

  const createdPlace = new Place({
    title,
    description,
    location: coordinates,
    address,
    image: req.file.path,
    creator: req.userData.userId,
  })

  let user
  try {
    user = await User.findById(req.userData.userId)
  } catch (error) {
    return next(new HttpError("Something went wrong!", 500))
  }

  if (!user)
    return next(new HttpError("Could not find a user with this id.", 404))

  try {
    const sess = await mongoose.startSession()
    sess.startTransaction()
    await createdPlace.save({ session: sess })
    user.places.push(createdPlace)
    await user.save({ session: sess })
    await sess.commitTransaction()
  } catch (error) {
    return next(new HttpError("Failed to create a place!", 500))
  }

  res.status(201).json({ place: createdPlace })
}

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty())
    next(new HttpError("Invalid inputs, please verify the fields.", 422))

  const { title, description } = req.body
  const placeId = req.params.pid
  let place

  try {
    place = await Place.findById(placeId)
  } catch (error) {
    return next(new HttpError("Something went wrong!", 500))
  }

  if (place.creator.toString() !== req.userData.userId)
    return next(new HttpError("You are not allowed to edit this place!", 401))

  place.title = title
  place.description = description

  try {
    place.save()
  } catch (error) {
    return next(new HttpError("Something went wrong!", 500))
  }

  res.status(200).json({ place: place.toObject({ getters: true }) })
}

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid

  let place
  try {
    place = await Place.findById(placeId).populate("creator")
  } catch (error) {
    return next(
      new HttpError("Something went wrong! Could not find the place.", 500)
    )
  }

  if (!place)
    return next(new HttpError("Could not find a place with this id.", 404))

  if (place.creator.id !== req.userData.userId)
    return next(new HttpError("You are not allowed to delete this place!", 401))

  const imagePath = place.image

  try {
    const sess = await mongoose.startSession()
    sess.startTransaction()
    await Place.deleteOne({ _id: placeId }).session(sess)
    place.creator.places.pull(place)
    await place.creator.save({ session: sess })
    await sess.commitTransaction()
  } catch (error) {
    return next(
      new HttpError("Something went wrong! Could not delete the place.", 500)
    )
  }

  fs.unlink(imagePath, (err) => {
    console.log(err)
  })

  res.status(200).json({ message: "Place deleted successfuly" })
}

exports.getPlaceById = getPlaceById
exports.getPlaceByUserId = getPlaceByUserId
exports.createPLace = createPLace
exports.updatePlace = updatePlace
exports.deletePlace = deletePlace
