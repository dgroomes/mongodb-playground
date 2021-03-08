# incremental

This is an intermediate MongoDB example that showcases how you might incrementally load input data into an existing
materialized view. This is extended from the [*Aggregation with the Zip Code Data Set*](https://docs.mongodb.com/manual/tutorial/aggregation-zip-code-data-set/)
example on the MongoDB website.

## Design

This project takes raw input data in the form of JSON ZIP Code documents and computes two analytical data sets:

1. Average population of ZIP areas by city
1. Average population of ZIP areas by state

Specifically, the input data is limited to the ZIP Code data for the state of Rhode Island and it is split across three
"split" files: `zips-RI-split-1.json`, `zips-RI-split-2.json`, and `zips-RI-split-3.json`. The purpose of these split files
is to exercise the use-case of incrementally adding input data to existing materialized views. The materialized views are
just MongoDB collections and they are updated incrementally using an [Aggregation Pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/)
with a [`$merge`](https://docs.mongodb.com/manual/reference/operator/aggregation/merge/#pipe._S_merge) stage as each "split"
file is loaded.

For example, consider some "origin" ZIP Code data which makes up the initial input data. This input data is then aggregated
into "Average population of the ZIP areas by city" which is saved into a collection called "zips_avg_pop_by_city".
Next, the "by city" data is used as an input data source that then gets aggregated into "Average population of the ZIP areas
by state" and into another collection. Later, new ZIP Code documents arrive and are added to the input data. These new documents need to be
incorporated to compute a new "by city" ZIP code population average and in turn the new "by city" data set must be
incorporated into the higher level "by state" data set.

How should the data be structured and how should the data update process be designed?

Ideally, the update process should be incremental for the sake of speedy updates. If it were not incremental, a refesh of
the materialized views would require a full re-computation over the full set of input data. This would be a bummer. On the
other hand, a data structure that accommodates incremental updates is inherently more complex than a simplistic data structure.
Just how much complexity do we need to introduce to accommodate incremental updates? And what is the performance advantage
of the incremental capability? This project aims to find out using an easy-to-follow example!

## Instructions

Pre-requisites: you must have NodeJS and MongoDB installed. 

* Start a MongoDB server
* Install project dependencies
  * `npm install`
* Load a portion of the Rhode Island ZIP Code data:
  * `mongoimport --db test --collection zips zips-RI-split-1.json`
* Compute an initial analytical data set of "averages":
  * `node src/zips-averages.js`
* Load the remainder of the Rhode Island data
  * ```
    mongoimport --db test --collection zips zips-RI-split-2.json
    mongoimport --db test --collection zips zips-RI-split-3.json
    ```
* *Incrementally* incorporate the new data to compute an updated version of the "averages" analytical data set
  * `node src/zips-averages-incremental.js`
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

* DONE Clean this up. I'm not sure exactly how. Maybe I need to upgrade to a proper NodeJS project instead of having so much
  scripting in the individual JS files which get executed by the mongo shell. I could get some code re-use with the `printAFewRecords`
  function for example.
  * DONE. Upgrade to a NodeJS project to better organize the code.
  * DONE Consolidate common code between `zips-averages.js` and `zips-averages-incremental.js`
* Support incremental updates for "Average population of the ZIP areas for each city" when replacement ZIP area
  data points are added. For example, the population for ZIP code 01001 (Agawam, MA) was 15,338 but at a later date increased
  to 15,776. Why is this interesting? Well, the existing map-reduce and "aggregation pipeline" examples I've seen are only
  additive, they don't actually replace old data. So, I think this will be an interesting example to see how it can actually
  be implemented. Will it require an awkward implementation? Note: this could be considered a de-duplication example because we have
  to de-duplicate the two data points for 01001: we have to toss the old population data and use the new data. Note: this
  will require re-thinking the "_id" used for the documents because Mongo will reject documents with the same ID. 
* Illustrate the performance advantage between incremental and non-incremental. This will require quite a bit of code especially
  around generating test data. I think a lot of test data will be needed. If there is too little test data, I think the
  execution times between incremental and non-incremental will be negligible because a lot of time is spent in the "fixed costs"
  of NodeJS startup and MongoDB query parsing and data fetching. These fixed costs should instead be amortized across a
  larger swath of test data and "incremental data load" operations and "materialized view refresh" operations. With the
  cost amortized, the execution times should better reflect the nature of the data access and data update process instead
  of illustrating stuff that is not germane to this experiment; rather, uninteresting stuff like NodeJS start up time and
  MongoDB query parsing etc. Note: the actual perf script part should be a simple timed test like: 1) start a Node program
  and initialize the database 2) load slice #1 of the data 3) Compute the averages (either incrementally
  or non-incrementally depending on what is being tests) and then 4) repeat steps #2 and #3 until all slices are loaded
  5) print timing results.
