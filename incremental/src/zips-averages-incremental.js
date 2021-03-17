// Compute multiple averages across the ZIP Code data. "Averaging" computations include:
//   * Average population of the ZIP areas for each *city*.
//   * Average population of the ZIP areas for each *state*.
//
// The averages data is computed using materialized views which can be incrementally updated as new raw input data arrives.

const {runWithDb} = require('./db')
const {refreshAllInc} = require('./zips')
const {sampleAvgPopByCityAggregation, sampleAvgPopByStateAggregation} = require('./zips-sample')


runWithDb(async db => {

  await refreshAllInc(db)

  await sampleAvgPopByCityAggregation(db)
  await sampleAvgPopByStateAggregation(db)
})
