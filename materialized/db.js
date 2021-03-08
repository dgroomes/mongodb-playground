// MongoDB utility functions

const { printPrettyJson } = require("./util")

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

// The app_meta_data collection will contain only one element. This is its ID.
const APP_META_DATA_ID = {_id: 1}

/**
 * Upsert the contents of the "app meta data" document.
 *
 * By our own convention, we will use a collection called "app_meta_data" to store some global meta data about the application.
 * It should only ever contain exactly one document. It will store data like the "last loaded time" and "last invocation
 * time for the zip-averages.js script".
 *
 * @param db the database to use
 * @param data the data to upsert into the document. It will be executed in a aggregation pipeline. This means you can use
 *        MongoDB system variables like "$$NOW" and they will resolve to their special value.
 */
async function upsertAppMetaData(db, data) {
  const coll = db.collection("app_meta_data")
  await coll.updateOne(APP_META_DATA_ID, [{$set: data}], {upsert: true})
}

/**
 * Get the app meta data
 * @param db
 * @return {Promise<*>}
 */
async function getAppMetaData(db) {
  return await db.collection("app_meta_data").findOne()
}

async function printAFewRecords(cursor) {
  for (let i = 0; await cursor.hasNext() && i < 3; i++) {
    printPrettyJson(await cursor.next())
  }
}

module.exports = {
  runWithDb,
  upsertAppMetaData,
  getAppMetaData,
  printAFewRecords
}
