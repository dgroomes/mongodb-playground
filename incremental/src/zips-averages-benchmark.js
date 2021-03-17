// Benchmark the "non-incremental approach" (zips-averages.js) over multiple phases of loading "splits" of data and
// refreshing the materialized views for each split.
//
// The purpose of benchmarking the non-incremental approach is that its performance results serve as a baseline to compare
// and contrast with the performance of the incremental approach (zips-average-incremental.js).

const {runWithDb} = require('./db')
const {avgByCity, avgByState} = require('./zips')
const {benchmark} = require('./zips-benchmark')

runWithDb(db => {
  console.log("Benchmarking the 'bare' averages script over multiple phases of loading the splits data...")
  const query = async function() {
    await avgByCity(db).next()
    await avgByState(db).next()
  }
  return benchmark(db, query)
})
