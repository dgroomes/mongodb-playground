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
async function sampleAvgPopByCityAggregation(db) {
  let cursor = await db.collection("zips_avg_pop_by_city_inc").find().sort({city_pop: -1})
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
async function sampleAvgPopByStateAggregation(db) {
  let cursor = await db.collection("zips_avg_pop_by_state_inc").find().sort({state_pop: -1})
  console.log("Average population of the ZIP areas for each state")
  await printAFewRecords(cursor)
}

module.exports = {
  sampleAvgPopByCityAggregation,
  sampleAvgPopByStateAggregation
}
