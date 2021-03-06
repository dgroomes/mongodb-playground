# incremental

This is an intermediate MongoDB example that showcases how you might incrementally load input data into an existing
analytical data set. This is extended from the [*Aggregation with the Zip Code Data Set*](https://docs.mongodb.com/manual/tutorial/aggregation-zip-code-data-set/)
example on the MongoDB website.

## Design

This project takes raw input data in the form of ZIP Code documents and computes an analytical data set of "average
population of ZIP areas by state". Specifically, the input data is limited to the ZIP Code data for the state of Rhode Island
and it is split across three "split" files: `zips-RI-split-1.json`, `zips-RI-split-2.json`, and `zips-RI-split-3.json`.
The purpose of these split files is to exercise the use-case of incrementally adding input data to an existing analytical
data set. Specifically, the analytical data set is a MongoDB collection that can be updated incrementally using an [Aggregation Pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/)
with a [`$merge`](https://docs.mongodb.com/manual/reference/operator/aggregation/merge/#pipe._S_merge) stage.

For example, consider some "origin" ZIP data which populates the collection initially. This is aggregated into "Average
population of the ZIP areas for each city" (see `queries/zips-average.js`) which is saved into a collection called "zips_avg_pop_by_city".
Later, new ZIP areas are added to the ZIP areas collection. These new ZIP area populations need to be incrementally
incorporated to compute a new average. Ideally, this work should be incremental and not require a full re-computation
of all the original raw data plus the new data (that would be a bummer design).

## Instructions

* Load a portion of the Rhode Island ZIP Code data:
  * `mongoimport --db test --collection zips zips-RI-split-1.json`
* Compute an initial analytical data set of "averages":
  * `mongo --quiet zips-average.js`
* Load the remainder of the Rhode Island data
  * ```
    mongoimport --db test --collection zips zips-RI-split-2.json
    mongoimport --db test --collection zips zips-RI-split-3.json
    ```
* *Incrementally* incorporate the new data to compute an updated version of the "averages" analytical data set
  * `mongo --quiet zips-average-incremental.js`

## Referenced materials

* [MongoDB: *Aggregation with the Zip Code Data Set* tutorial](https://docs.mongodb.com/manual/tutorial/aggregation-zip-code-data-set/)
* [MongoDB: *Data Model Design*](https://docs.mongodb.com/manual/core/data-model-design)
    * Are you coming from a traditional SQL and relational background which favors a normalized data model? This page is
      an important one to read. It describes how idiomatic data model designs in Mongo are usually purposely de-normalized.
      In practice, this means "Store your data as embedded data in an existing document. Don't make a new collection!" (at
      least, that's my understanding so far).
* [MongoDB: *Perform Incremental Map-Reduce*](https://docs.mongodb.com/manual/tutorial/perform-incremental-map-reduce/)

## Wish List

General clean-ups, TODOs and things I wish to implement for this project:

* Clean this up. I'm not sure exactly how. Maybe I need to upgrade to a proper NodeJS project instead of having so much
  scripting in the individual JS files which get executed by the mongo shell. I could get some code re-use with the `printAFewRecords`
  function for example.
