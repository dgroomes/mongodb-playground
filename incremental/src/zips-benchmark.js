// Functions for executing a benchmark against the "zips" collection
const {lines} = require("./util")

/**
 * Benchmark a query on the ZIP Code data over multiple phases of loading the splits data. Prints the results.
 * @param db
 * @param query
 * @return {Promise<void>}
 */
async function benchmark(db, query) {
  const SPLIT_SIZE = 1000
  const timings = []
  const zipAreas = lines("zips.json")
  const zips = db.collection("zips");

  let docIdx = 0
  let splitIdx = 0
  let zipAreasBuffer = []
  for await (const zipArea of zipAreas) {
    docIdx++
    zipAreasBuffer.push(JSON.parse(zipArea))

    if (docIdx % SPLIT_SIZE === 0) {
      splitIdx++
      await zips.insertMany(zipAreasBuffer)

      const start = Date.now();
      await query()
      const end = Date.now();
      const duration = end - start

      // Record the timing results and clear the buffer
      timings.push({ split: splitIdx, duration:  duration})
      zipAreasBuffer = []
    }
  }

  console.log("Benchmark complete. Execution timings for each phase:")
  console.table(timings)
}

module.exports = {
  benchmark
}
