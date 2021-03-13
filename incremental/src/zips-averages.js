// Compute multiple averages across the ZIP Code data. "Averaging" computations include:
//   * Average population of the ZIP areas for each *city*.
//   * Average population of the ZIP areas for each *state*.

const {runWithDb, printAFewRecords} = require('./db')

runWithDb(async db => {

  let cityAvgCursor = db.collection("zips").aggregate([
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
    {
      $sort: {
        city_pop: -1
      }
    }
  ])

  console.log("Average population of ZIP areas by city:\n\n")
  await printAFewRecords(cityAvgCursor)

  let stateAvgCursor = db.collection("zips").aggregate([
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
    {
      $sort: {
        state_pop: -1
      }
    }
  ])

  console.log("Average population of ZIP areas by state:\n\n")
  await printAFewRecords(stateAvgCursor)
})
