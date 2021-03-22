// Compute multiple averages across the ZIP Code data into materialized views. "Averaging" computations include:
//   * Average population of the ZIP areas for each *city*.
//   * Average population of the ZIP areas for each *state*.
//
// Also, print a sample of the averages data.

const {runWithDb, printAFewRecords} = require('./db')
const {refreshAll} = require('./zips')

runWithDb(async db => {

  await refreshAll(db)

  let cityAvgCursor = await db.collection("zips_avg_pop_by_city").find().project({
    _id: "$_id",
    "city_pop": "$city_pop",
    "city_zip_areas": "$city_zip_areas",
    "avg_zip_area_pop": "$avg_zip_area_pop"
  }).sort({city_pop: -1})
  console.log("Average population of ZIP areas by city:")
  await printAFewRecords(cityAvgCursor)

  let stateAvgCursor = await db.collection("zips_avg_pop_by_state").find().project({
    _id: "$_id",
    "state_pop": "$state_pop",
    "state_zip_areas": "$state_zip_areas",
    "avg_zip_area_pop": "$avg_zip_area_pop"
  }).sort({state_pop: -1})
  console.log("Average population of ZIP areas by state:")
  await printAFewRecords(stateAvgCursor)
})
