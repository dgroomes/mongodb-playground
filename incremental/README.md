# incremental

This is an intermediate MongoDB example that showcases how you might incrementally load input data into an existing
analytical data set. This is extended from the [*Aggregation with the Zip Code Data Set*](https://docs.mongodb.com/manual/tutorial/aggregation-zip-code-data-set/)
example on the MongoDB website.

## Instructions

* Load a portion of the Rhode Island ZIP Code data:
  * `mongoimport --db test --collection zips data/zips_RI_split_1.json`
* Compute an initial analytical data set of "averages":
  * `mongo --quiet queries/zips-average.js`
* Load the remainder of the Rhode Island data
  * ```
    mongoimport --db test --collection zips data/zips_RI_split_2.json
    mongoimport --db test --collection zips data/zips_RI_split_3.json
    ```
* *Incrementally* incorporate the new data to compute an updated version of the "averages" analytical data set
  * `mongo --quiet queries/zips-average-incremental.js`

### Notes

* Import all of the ZIP code data files with this command:
  ```
  mongoimport --db test --collection zips <(cat data/zips_*)
  ```
* The Rhode Island ZIP code data exists in both the `zips_RI.json` file and is duplicated unevenly across three "split"
  files: `zips_RI_split_1.json`, `zips_RI_split_2.json`, and `zips_RI_split_3.json`. The purpose of these split files is
  to exercise the use-case of incrementally adding input data to a collection that is aggregated. For example, consider
  some "origin" ZIP data which populates the collection initially. This is aggregated into "Average population of the
  ZIP areas for each city" (see `queries/zips-average.js`) which is saved into a collection called "zips_avg_pop_by_city".
  Later, new ZIP areas are added to the ZIP areas collection. These new ZIP area populations need to be incrementally
  incorporated to compute a new average. Ideally, this work should be incremental and not require a full re-computation
  of all the original raw data plus the new data (that would be a bummer design). This is possible but I'm not sure
  exactly how I will design this.
* Import Rhode Island ZIP areas data and compute the averages (it should show `"avg_zip_pop_by_state" : 14539`):
  ```
  mongoimport --db test --collection zips data/zips_RI.json
  mongo --quiet queries/zips-average.js
  ```
* Import Rhode Island ZIP areas data by importing the individual "split" files and compute the averages (it should show
  the same `14539` value as the non-split approach!):
  ```
  mongoimport --db test --collection zips data/zips_RI_split_1.json
  mongoimport --db test --collection zips data/zips_RI_split_2.json
  mongoimport --db test --collection zips data/zips_RI_split_3.json
  mongo --quiet queries/zips-average.js
  ```

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
