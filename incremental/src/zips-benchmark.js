/**
 * Benchmark both of the approaches: incremental and non-incremental.
 *
 * The purpose of benchmarking the non-incremental approach is that its performance results serve as a baseline to
 * compare and contrast with the performance of the incremental approach.
 */

const {lines} = require("./util")
const readline = require("readline")
const {runWithDb} = require('./db')
const {refreshAll, refreshAllInc} = require('./zips')

// todo fix the printing
const results = {
  incremental: {},
  nonIncremental: {}
}

/**
 * Benchmark one of the approaches, parameterized via "query", over multiple phases of loading the splits data.
 * Prints the progress in a self-erasing line on the terminal. Then after it finishes, prints the results.
 * @param db
 * @param query
 * @return {Promise<void>}
 */
async function benchmark(db, query) {
  const SPLIT_SIZE = 1000
  const timings = []
  const zipAreas = lines("zips.json")
  const zips = db.collection("zips");
  const stream = process.stdout

  let docIdx = 0
  let splitIdx = 1
  let zipAreasBuffer = []

  // Insert the split data. This function declaration is unusual. I need to declare the insert code in a function because
  // I need to be able to call it from inside the loop while and after the loop is done. So because I need to call the code
  // twice, I need a function. Also I want the closures over "splitIdx" and "zipAreasBuffer" which is why I didn't declare
  // this function at the top-level, where I would need to pass them as params instead of referencing them as closures.
  // Alternatively, I could do an object-oriented design and use a JavaScript class instead, which has state and functions!
  async function insertSplit() {
    readline.clearLine(stream, 0)
    readline.cursorTo(stream, 0)
    stream.write(`Executing split ${splitIdx}`)

    await zips.insertMany(zipAreasBuffer)

    const start = Date.now();
    await query()
    const end = Date.now();
    const duration = end - start

    readline.cursorTo(stream, 0)
    stream.write("")

    // Record the timing results and clear the buffer
    timings.push({split: splitIdx, duration: duration})
    zipAreasBuffer = []
  }

  for await (const zipArea of zipAreas) {
    docIdx++
    zipAreasBuffer.push(JSON.parse(zipArea))

    if (docIdx % SPLIT_SIZE === 0) {
      await insertSplit()
      splitIdx++
    }
  }
  // Insert the remainder. This split will always be the shortest one.
  await insertSplit()

  console.log("Benchmark complete. Execution timings for each phase:")
  console.table(timings)
}

async function benchmarkAll() {


}

runWithDb(async db => {

  // Kick off the benchmark for the non-incremental approach
  const nonIncremental = benchmark(db, async function () {
    await refreshAll(db)
  })

  // Kick off the benchmark for the incremental approach
  const incremental = benchmark(db, async function () {
    await refreshAllInc(db)
  })

  // Await both of them to finish
  await incremental
  await nonIncremental
})
