// Functions for computing data with the ZIP Code data.
// These functions are the **core** (read: the interesting parts!) of the project.

const {getAppMetaData, upsertAppMetaData} = require('./db')

/**
 * Set the "last_modified" field on records where it is not set.
 */
async function lastModified(db) {
  return await db.collection("zips").updateMany(
    {last_modified: {$exists: false}},
    [
      {$set: {last_modified: "$$NOW"}}
    ]
  )
}

/**
 * Refresh the non-incremental "by city" materialized view.
 */
function refreshAvgPopByCity(db) {
  return db.collection("zips").aggregate([
    {
      $group: {
        "_id": {city: "$city", state: "$state"},
        city_zip_areas: {$sum: 1},
        city_pop: {$sum: "$pop"}
      }
    },
    {
      $addFields: {
        avg_zip_area_pop: {
          $trunc: {
            $divide: ["$city_pop", "$city_zip_areas"]
          }
        }
      }
    },
    {$out: "zips_avg_pop_by_city"}
  ]).next()
}

/**
 * Refresh the non-incremental "by state" materialized view.
 */
function refreshAvgPopByState(db) {
  return db.collection("zips").aggregate([
    {
      $group: {
        "_id": "$state",
        state_zip_areas: {$sum: 1},
        state_pop: {$sum: "$pop"}
      }
    },
    {
      $addFields: {
        avg_zip_area_pop: {
          $trunc: {
            $divide: ["$state_pop", "$state_zip_areas"]
          }
        }
      }
    },
    {$out: "zips_avg_pop_by_state"}
  ]).next()
}

/**
 * Refresh the non-incremental materialized views.
 */
async function refreshAll(db) {
  await refreshAvgPopByCity(db)
  await refreshAvgPopByState(db)
}

/**
 * Adorn the aggregation pipeline with a "$match" stage to match only documents that have recently been modified and
 * need to be processed. The purpose of this check is to filter out documents that have already been incorporated into
 * the "$into" collection. This check is a core part of an incremental update strategy.
 * @param db
 * @param incorporatePipeline
 * @return {Promise<void>}
 */
async function matchUnprocessed(db, incorporatePipeline) {
  const appMetaData = await getAppMetaData(db)
  const lastLoadedTime = appMetaData.last_loaded_time
  if (lastLoadedTime === undefined) {
    // The 'last loaded time' is undefined. This must be the first execution of the load.
  } else {
    incorporatePipeline.unshift({
      $match: {
        "last_modified": {
          $gt: lastLoadedTime
        }
      }
    })
  }
}

/**
 * Incorporate new ZIP records incrementally into the "zips_grouped_by_city" aggregation.
 *
 * This is the basis of the "incremental load" aggregation pipeline to incorporate new ZIP records into the collection of
 * ZIP areas grouped by city.
 *
 * For the very first execution of the load, all records are new. For all subsequent executions of the load, new records
 * are identified as those that have a "last_modified" date greater than the last load time. These records
 * have not been incorporated yet into the aggregations.
 *
 * Importantly, this operation is idempotent. Any incoming ZIP area documents that had previously already been incorporated
 * will be re-incorporated without "double counting" thanks to the use of a "map" data structure. Specifically, the "$mergeObjects"
 * MongoDB operator is used in the query to merge the data which means that documents for the same ZIP area will be reduced
 * down to just a single instance (the newest document).
 *
 * Commentary: this is quite a verbose MongoDB query (maybe it's not so complex really compared to an equivalent SQL example,
 * but it is verbose). The number of stages in the aggregation pipeline is average. There are only three: "$group", "$set",
 * "$merge". The complexity lies inside the "$merge" stage where it is necessary to re-mold the ZIP area document data
 * into an object then back into an array. This "molding" part of the query is duplicated in the query because it
 * must be done for both incoming ZIP area documents and the existing ZIP area documents.
 *    Why do all of this "molding"? It's the only way I could figure out how to upsert sub-documents that are contained in
 * an array. Is there a more idiomatic way? I think this is pretty close to idiomatic because I've carefully learned and
 * referenced the official docs as I've learned and explored MongoDB. In fact, the fact that this "incremental ZIP area
 * merge" operation is done without custom server-side JavaScript (executed in the MongoDB server) means that I get bonus
 * points and that it is automatically more "modern MongoDB" than using a custom function via the "$function"
 * operator. MongoDB gives clear direction that an aggregation pipeline should be all you need and that the old map-reduce
 * functionality is not recommended and custom functions are not recommended. BUT the equivalent JavaScript code would have
 * been concise so I had to really convince myself to not do server-side JavaScript.
 *    Also, I think there are just limited options for managing sub-documents in arrays. For example, this highly up-voted StackOverflow
 * answer (https://stackoverflow.com/a/18174132) reads: "MongoDB's support for updating nested arrays is poor." But to be
 * fair, that answer is old. In any case, while I took the many hours to find "$map", "$arrayToObject", "$objectToArray"
 * and then additional time to understand "$let" (very convenient, I like it!) beyond the hours I took to look for something
 * that did not exist (advertised patterns for merging new data into sub-documents in a "$merge") I found that I was yearning
 * for the ergonomics of the "update" command with the "upsert: true" option. Unfortunately, the inside of an aggregation
 * pipeline does not offer those kinds of ergonomics or much of the full feature set of Mongo options that you can get in
 * other contexts.
 */
async function incorporateNewZips(db) {
  // Preparation step. Set the "last_modified" field on records where it is not set.
  await lastModified(db)

  const incorporatePipeline = [
    {
      $group: {
        "_id": {city: "$city", state: "$state"},
        zip_areas: {
          $addToSet: "$$CURRENT"
        }
      }
    },
    {
      "$set": {
        last_modified: "$$NOW"
      }
    },
    {
      $merge: {
        into: "zips_grouped_by_city",
        whenMatched: [
          {
            $set: {
              zip_areas: {
                $let: {
                  vars: {
                    incoming: {
                      $arrayToObject: {
                        $map: {
                          input: "$$new.zip_areas",
                          as: "zip_area",
                          in: {
                            k: "$$zip_area._id",
                            v: "$$zip_area"
                          }
                        }
                      }
                    },
                    existing: {
                      $arrayToObject: {
                        $map: {
                          input: "$zip_areas",
                          as: "zip_area",
                          in: {
                            k: "$$zip_area._id",
                            v: "$$zip_area"
                          }
                        }
                      }
                    }
                  },
                  in: {
                    $map: {
                      input: {
                        $objectToArray: {
                          $mergeObjects: ["$$existing", "$$incoming"]
                        }
                      },
                      as: "kv",
                      in: "$$kv.v"
                    }
                  }
                }
              },
              last_modified: "$$new.last_modified"
            }
          }
        ]
      }
    }
  ]

  await matchUnprocessed(db, incorporatePipeline);

  return await db.collection("zips").aggregate(incorporatePipeline).next()
}

/**
 * Incrementally refresh the incremental materialized views.
 */
async function refreshAllInc(db) {
  await incorporateNewZips(db)

  // Compute the "by city" ZIP area population averages.
  await refreshAvgPopByCityInc(db)

  // Now, we are moving on to computing the "by state" averages. Similar to the "by city" average, we will first perform
  // the useful pre-work of grouping the data set by state.
  await incorporateIntoGroupedByState(db)

  // Compute the "by state" ZIP area population averages.
  await refreshAvgPopByStateInc(db)

  // Commit the completed work by updating the "last loaded time" application meta data field.
  await upsertAppMetaData(db, {last_loaded_time: "$$NOW"})
}

/**
 * Incrementally refresh the "by city" materialized view.
 * @param db the database to use
 * @return {Promise<void>}
 */
async function refreshAvgPopByCityInc(db) {
  const incorporatePipeline = [
    {
      $project: {
        city_zip_areas: {$size: "$zip_areas"},
        city_pop: {$sum: "$zip_areas.pop"},
      }
    },
    {
      $addFields: {
        avg_zip_area_pop: {
          $trunc: {
            $divide: ["$city_pop", "$city_zip_areas"]
          }
        },
        last_modified: "$$NOW"
      }
    },
    {
      $merge: {
        into: "zips_avg_pop_by_city_inc"
      }
    }
  ]

  await matchUnprocessed(db, incorporatePipeline)

  return await db.collection("zips_grouped_by_city").aggregate(incorporatePipeline).next()
}

/**
 * Incrementally incorporate new and updated "by city" ZIP area summaries into the "zips_grouped_by_state" intermediate
 * collection
 *
 * @param db the database to use
 * @return {Promise<*>}
 */
async function incorporateIntoGroupedByState(db) {
  const incorporatePipeline = [
    {
      "$group": {
        _id: "$_id.state",
        by_city_zip_summaries: {
          $addToSet: "$$CURRENT"
        }
      }
    },
    {
      "$set": {
        last_modified: "$$NOW"
      }
    },
    {
      $merge: {
        into: "zips_grouped_by_state",
        whenMatched: [
          {
            $set: {
              zip_areas: {
                $let: {
                  vars: {
                    incoming: {
                      $arrayToObject: {
                        $map: {
                          input: "$$new.by_city_zip_summaries",
                          as: "zip_summary",
                          in: {
                            k: "$$zip_summary._id.city",
                            v: "$$zip_summary"
                          }
                        }
                      }
                    },
                    existing: {
                      $arrayToObject: {
                        $map: {
                          input: "$by_city_zip_summaries",
                          as: "zip_summary",
                          in: {
                            k: "$$zip_summary._id.city",
                            v: "$$zip_summary"
                          }
                        }
                      }
                    }
                  },
                  in: {
                    $map: {
                      input: {
                        $objectToArray: {
                          $mergeObjects: ["$$existing", "$$incoming"]
                        }
                      },
                      as: "kv",
                      in: "$$kv.v"
                    }
                  }
                }
              },
              last_modified: "$$new.last_modified"
            }
          }
        ]
      }
    }
  ]

  matchUnprocessed(db, incorporatePipeline)

  return await db.collection("zips_avg_pop_by_city_inc").aggregate(incorporatePipeline).next()
}

/**
 * Incrementally refresh the incremental "by state" materialized view.
 * @param db
 * @return {Promise<void>}
 */
async function refreshAvgPopByStateInc(db) {
  const incorporatePipeline = [
    {
      "$project": {
        _id: "$_id",
        state_zip_areas: {$sum: "$by_city_zip_summaries.city_zip_areas"},
        state_pop: {$sum: "$by_city_zip_summaries.city_pop"}
      }
    },
    {
      $addFields: {
        avg_zip_area_pop: {
          $trunc: {
            $divide: ["$state_pop", "$state_zip_areas"]
          }
        }
      }
    },
    {
      $merge: {
        into: "zips_avg_pop_by_state_inc"
      }
    }
  ]

  await matchUnprocessed(db, incorporatePipeline)

  await db.collection("zips_grouped_by_state").aggregate(incorporatePipeline).next()
}

module.exports = {
  refreshAll,
  refreshAllInc
}
