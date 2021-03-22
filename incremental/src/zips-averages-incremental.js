// Compute multiple averages across the ZIP Code data into materialized using a special "incremental approach".
// "Averaging" computations include:
//   * Average population of the ZIP areas for each *city*.
//   * Average population of the ZIP areas for each *state*.
//
// The averages data is computed using materialized views which can be incrementally updated as new raw input data arrives.
// Also, print a sample of the averages data.

const {runWithDb} = require('./db')
const {refreshAllInc} = require('./zips')
const {sampleAvgPopByCityInc, sampleAvgPopByStateInc} = require('./zips-sample')


runWithDb(async db => {

  await refreshAllInc(db)

  await sampleAvgPopByCityInc(db)
  await sampleAvgPopByStateInc(db)
})
