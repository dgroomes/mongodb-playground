// Common functions

/**
 * Pretty format JSON.
 */
function prettyJson(obj) {
  return JSON.stringify(obj, null, 2);
}

/**
 * Pretty format JSON and print it to the console
 */
function printPrettyJson(obj) {
  console.log(prettyJson(obj))
}

/**
 * Run the given function and pass it a MongoDB database connection.
 * Handles connection set up and tear down. Exits if an error occurs.
 *
 * @param fn the given function to run.
 */
async function runWithDb(fn) {
  const { MongoClient } = require("mongodb");
  const URI = "mongodb://localhost:27017";
  const client = new MongoClient(URI, { useUnifiedTopology: true });
  try {
    await client.connect();
    const database = client.db('test');

    await fn(database)
  } catch(e) {
    console.log(`Unexpected error while executing a function against the database. Will terminate.`)
    console.log(e)
    process.exit(1)
  } finally {
    console.log("Closing the client connection.")
    await client.close();
  }
}

/**
 * Set the "lastModified" field on records where it is not set.
 */
async function lastModified(db) {
  return await db.collection("zips").updateMany(
    {lastModified: {$exists: false}},
    [
      {$set: {lastModified: "$$NOW"}}
    ]
  )
}

async function printAFewRecords(cursor) {
  for (let i = 0; await cursor.hasNext() && i < 3; i++) {
    printPrettyJson(await cursor.next())
  }
}

module.exports = {
  runWithDb,
  lastModified,
  printAFewRecords
}
