// Compute multiple averages across the ZIP Code data into materialized views. "Averaging" computations include:
//   * Average population of the ZIP areas for each *city*.
//   * Average population of the ZIP areas for each *state*.
//
// Also, print a sample of the averages data.

const {runWithDb, printAFewRecords} = require('./db')
const {avgByCity, avgByState} = require('./zips')

runWithDb(async db => {

  let cityAvgCursor = avgByCity(db)
  console.log("Average population of ZIP areas by city:")
  await printAFewRecords(cityAvgCursor)

  let stateAvgCursor = avgByState(db)
  console.log("Average population of ZIP areas by state:")
  await printAFewRecords(stateAvgCursor)
})
