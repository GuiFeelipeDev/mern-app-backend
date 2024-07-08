const { default: axios } = require("axios")
const HttpError = require("../models/http-error")

const API_KEY = process.env.GOOGLE_API_KEY

const getCoordsForAddress = async (address) => {
  const res = await axios.get(`https://maps.googleapis.com/maps/api/geocode
/json?address=${encodeURIComponent(address)}&key=${API_KEY}`)

  const data = await res.data

  if (!data || data.status === "ZERO_RESULTS")
    throw new HttpError("Could not find this place.", 422)

  const coordinates = data.results[0].geometry.location

  return coordinates
}

module.exports = getCoordsForAddress
