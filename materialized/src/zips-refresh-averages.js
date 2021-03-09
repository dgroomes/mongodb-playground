// Compute multiple averages across the ZIP Code data. "Averaging" computations include:
//   * Average population of the ZIP areas for each *city*.
//   * Average population of the ZIP areas for each *state*.
//
// The output of the averages computations are stored in their own collections. These are so-called "materialized views".

const {runWithDb} = require('./db')
const {refreshAvgPopByCityAggregation, refreshAvgPopByStateAggregation} = require('./zips')
const {sampleAvgPopByCityAggregation, sampleAvgPopByStateAggregation} = require('./zips-sample')

runWithDb(async db => {

  // Compute the "by city" ZIP area population averages.
  await refreshAvgPopByCityAggregation(db)
  await sampleAvgPopByCityAggregation(db)

  // Compute the "by state" ZIP area population averages.
  await refreshAvgPopByStateAggregation(db)
  await sampleAvgPopByStateAggregation(db)
})
