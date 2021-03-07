// Functions for computing data with the ZIP Code data.
// These functions are the **core** (read: the interesting parts!) of the project.

const {printAFewRecords} = require("./db")

/**
 * Set the "lastModified" field on records where it is not set.
 */
async function lastModified(db) {
  return await db.collection("zips").updateMany(
    {lastModified: {$exists: false}},
    [
      {$set: {lastModified: "$$NOW"}}
    ]
  )
}

/**
 * Refresh the "zips_avg_pop_by_city" aggregation collection
 * @param db the database to use
 * @return {Promise<void>}
 */
async function refreshAvgPopByCityAggregation(db) {
  return await db.collection("zips_grouped_by_city").aggregate([
    {
      $project: {
        city_zip_areas: {$size: "$zip_areas"},
        city_pop: {$sum: "$zip_areas.pop"},
      }
    },
    {
      $addFields: {
        avg_zip_area_pop_across_city: {
          $trunc: {
            $divide: ["$city_pop", "$city_zip_areas"]
          }
        }
      }
    },
    {$out: "zips_avg_pop_by_city"}
  ]).next()
}

/**
 * Print a sample of the "zips_avg_pop_by_city" aggregation collection.
 *
 * The sample is retrieved after a sort so this prints a deterministic set of documents.
 *
 * @param db the database to use
 * @return {Promise<void>}
 */
async function sampleAvgPopByCityAggregation(db) {
  let cursor = await db.collection("zips_avg_pop_by_city").find().sort({city_pop: -1})
  console.log("Average population of the ZIP areas for each city")
  await printAFewRecords(cursor)
}

module.exports = {
  lastModified,
  refreshAvgPopByCityAggregation,
  sampleAvgPopByCityAggregation
}
