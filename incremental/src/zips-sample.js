// Functions for sampling data from the ZIP Code collections.

const {printAFewRecords} = require("./db")

/**
 * Print a sample of the "zips_avg_pop_by_city_inc" aggregation collection.
 *
 * The sample is retrieved after a sort so this prints a deterministic set of documents.
 *
 * @param db the database to use
 * @return {Promise<void>}
 */
async function sampleAvgPopByCityInc(db) {
  let cursor = await db.collection("zips_avg_pop_by_city_inc").find().project({
    _id: "$_id",
    "city_pop": "$city_pop",
    "city_zip_areas": "$city_zip_areas",
    "avg_zip_area_pop": "$avg_zip_area_pop"
  }).sort({city_pop: -1})
  console.log("Average population of the ZIP areas for each city")
  await printAFewRecords(cursor)
}

/**
 * Print a sample of the "zips_avg_pop_by_state_inc" aggregation collection.
 *
 * The sample is retrieved after a sort so this prints a deterministic set of documents.
 *
 * @param db the database to use
 * @return {Promise<void>}
 */
async function sampleAvgPopByStateInc(db) {
  let cursor = await db.collection("zips_avg_pop_by_state_inc").find().project({
    _id: "$_id",
    "state_pop": "$state_pop",
    "state_zip_areas": "$state_zip_areas",
    "avg_zip_area_pop": "$avg_zip_area_pop"
  }).sort({state_pop: -1})
  console.log("Average population of the ZIP areas for each state")
  await printAFewRecords(cursor)
}

module.exports = {
  sampleAvgPopByCityInc,
  sampleAvgPopByStateInc
}
