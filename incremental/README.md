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

Pre-requisites: you must have NodeJS and MongoDB installed. 

* Start a MongoDB server
* Install project dependencies
  * `npm install`
* Load a portion of the Rhode Island ZIP Code data:
  * `mongoimport --db test --collection zips zips-RI-split-1.json`
* Compute an initial analytical data set of "averages":
  * `node zips-average.js`
* Load the remainder of the Rhode Island data
  * ```
    mongoimport --db test --collection zips zips-RI-split-2.json
    mongoimport --db test --collection zips zips-RI-split-3.json
    ```
* *Incrementally* incorporate the new data to compute an updated version of the "averages" analytical data set
  * `node zips-average-incremental.js`
  * Success!

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

* IN PROGRESS Clean this up. I'm not sure exactly how. Maybe I need to upgrade to a proper NodeJS project instead of having so much
  scripting in the individual JS files which get executed by the mongo shell. I could get some code re-use with the `printAFewRecords`
  function for example.
  * DONE. Upgrade to a NodeJS project to better organize the code.
  * Consolidate common code between `zips-average.js` and `zips-average-incremental.js`
* Support incremental updates for "Average population of the ZIP areas for each city" when replacement ZIP area
  data points are added. For example, the population for ZIP code 01001 (Agawam, MA) was 15,338 but at a later date increased
  to 15,776. Why is this interesting? Well, the existing map-reduce and "aggregation pipeline" examples I've seen are only
  additive, they don't actually replace old data. So, I think this will be an interesting example to see how it can actually
  be implemented. Will it require an awkward implementation? Note: this could be considered a de-duplication example because we have
  to de-duplicate the two data points for 01001: we have to toss the old population data and use the new data. Note: this
  will require re-thinking the "_id" used for the documents because Mongo will reject documents with the same ID. 
