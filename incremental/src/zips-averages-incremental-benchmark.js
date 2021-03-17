// Like "zips-averages-benchmark.js" but for the incremental approach.

const {runWithDb} = require('./db')
const {refreshAllInc} = require('./zips')
const {benchmark} = require('./zips-benchmark')

runWithDb(db => {
  console.log("Benchmarking the incremental approach over multiple phases of loading the splits data...")
  const query = async function() {
    await refreshAllInc(db)
  }
  return benchmark(db, query)
})
