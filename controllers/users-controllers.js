const HttpError = require("../models/http-error")
const { validationResult } = require("express-validator")
const User = require("../models/user")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

const getUsers = async (req, res, next) => {
  let users
  try {
    users = await User.find({}, "-password")
  } catch (error) {
    return next(HttpError("Something went wrong fetching the users.", 500))
  }

  res.json({ users: users.map((item) => item.toObject({ getters: true })) })
}

const signup = async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty())
    return next(new HttpError("Invalid inputs, please verify the fields.", 422))

  const { name, email, password } = req.body
  let hasUser

  try {
    hasUser = await User.findOne({ email: email })
  } catch (error) {
    return next(
      new HttpError("Something went wrong, unable to catch the user.", 500)
    )
  }

  if (hasUser) return next(new HttpError("Email already exists!", 422))

  let hashedPass

  try {
    hashedPass = await bcrypt.hash(password, 12)
  } catch (error) {
    next(new HttpError("Could not create a user, try again.", 500))
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPass,
    image: req.file.path,
    places: [],
  })

  let token
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "2h" }
    )
  } catch (error) {
    next(new HttpError("Could not create a user, try again.", 500))
  }

  try {
    await createdUser.save()
  } catch (error) {
    return next(new HttpError("Something went wrong saving the user.", 500))
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token })
}

const login = async (req, res, next) => {
  const { email, password } = req.body
  const identifiedUser = await User.findOne({ email: email })

  if (!identifiedUser)
    return next(new HttpError("Email or password is incorrect.", 403))

  let isValidPass = false

  try {
    isValidPass = await bcrypt.compare(password, identifiedUser.password)
  } catch (error) {
    next(new HttpError("Could not validate the login, try again.", 500))
  }

  if (!isValidPass)
    return next(new HttpError("Email or password is incorrect.", 401))

  let token
  try {
    token = jwt.sign(
      { userId: identifiedUser.id, email: identifiedUser.email },
      process.env.JWT_KEY,
      { expiresIn: "2h" }
    )
  } catch (error) {
    next(new HttpError("Could not login, try again.", 500))
  }

  res.json({
    userId: identifiedUser.id,
    email: identifiedUser.email,
    token,
  })
}

exports.getUsers = getUsers
exports.signup = signup
exports.login = login
