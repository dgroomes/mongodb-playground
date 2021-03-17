// Compute multiple averages across the ZIP Code data into materialized views. "Averaging" computations include:
//   * Average population of the ZIP areas for each *city*.
//   * Average population of the ZIP areas for each *state*.
//
// Also, print a sample of the averages data.

const {runWithDb, printAFewRecords} = require('./db')
const {refreshAll} = require('./zips')

runWithDb(async db => {

  await refreshAll(db)

  let cityAvgCursor = await db.collection("zips_avg_pop_by_city").find().sort({city_pop: -1})
  console.log("Average population of ZIP areas by city:")
  await printAFewRecords(cityAvgCursor)

  let stateAvgCursor = await db.collection("zips_avg_pop_by_state").find().sort({state_pop: -1})
  console.log("Average population of ZIP areas by state:")
  await printAFewRecords(stateAvgCursor)
})
