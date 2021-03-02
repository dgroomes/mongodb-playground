# mongodb-playground

📚 Learning and exploring MongoDB.

Note: this was developed on macOS.

## Instructions

As a pre-requisite, you must install Mongo. See the [Installing Mongo](#installing-mongo) section for options.

1. Start the MongoDB server
1. Load the database with ZIP Code test data from the state of Georgia (GA) (this is from the official Mongo site):
   * `mongoimport --db test --collection zips data/zips_GA.json`
1. Start a shell session:
   * `mongo`
1. Switch to the `test` database (this is the database with the ZIP Code data)
   * `use test`
1. Query the size of the `zips` collection:
   * `db.zips.find().size()`
   * Success, you've done it!
1. Stop the MongoDB server

### Queries

There are pre-written queries in the `queries/` directory. They can be executed via the `mongo` shell. For example:

```
mongo --quiet queries/zips-size.js
```

It should print `635` in the terminal.

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
* Import Rhode Island ZIP areas data and compute the averages (it should show `"avg_zip_pop_by_state" : 14539...`):
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
* NOT IMPLEMENTED
  Load a portion of the Rhode Island data, compute the averages, load the remainder and compute the new averages using
  the *incremental* averaging script (the final average should show the same `14539` value as the non-incremental approach!):
  ```
  mongoimport --db test --collection zips data/zips_RI_split_1.json
  mongo --quiet queries/zips-average.js
  mongoimport --db test --collection zips data/zips_RI_split_2.json
  mongoimport --db test --collection zips data/zips_RI_split_3.json
  mongo --quiet queries/zips-average-incremental.js
  ```  

### Installing Mongo

There are various options for getting up and running with MongoDB locally. The most direct way is to download MongoDB
from the official website (see the relevant link under [Referenced materials](#referenced-materials)) or via HomeBrew. You
should then follow the additional documentation on the MongoDB site to learn how to create a data directory, start the
MongoDB server, start an interactive shell session using the `mongo` command, and stop the MongoDB server. You should also
install the separate package known as *MongoDB Database Tools*.

An alternative option is to run a MongoDB server using Docker. There is a `docker-compose.yml` file in this project to help
accomplish that. Using the Docker option, you can do the following:

* Start a MongoDB server with `docker-compose up --detach`
* Enter an interactive `mongo` shell session with `docker exec -it mongodb-playground_mongo_1 mongo`
  * NOTE: while this option is clever, it would pay off to install Mongo so that you can use the `mongo` command directly
    to start a shell session instead of this extra-ness of starting a session via the Docker container. The strength of
    the "Mongo-via-Docker" option is in running the *server* and handling the data directory in a convenient way to the user.
    Whereas starting a shell session (*client*) is more convenient with `mongo` compared to the long-winded `docker exec...` alternative. 
* Stop the server with `docker-compose down`

## Wish List

General clean-ups, TODOs and things I wish to implement for this project:

* DONE Create test data and load it into Mongo
* DONE Create some test queries
* (IN PROGRESS) Incrementally update an aggregation ([see this MongoDB official example](https://docs.mongodb.com/manual/tutorial/perform-incremental-map-reduce/))

## Referenced materials

* [MongoDB: download *Community Server*](https://www.mongodb.com/try/download/community)
* [MongoDB: *Installing the Database Tools on macOS*](https://docs.mongodb.com/database-tools/installation/installation-macos/)
* [MongoDB: run the `mongod` process](https://docs.mongodb.com/manual/tutorial/manage-mongodb-processes/)
* [MongoDB: *Aggregation with the Zip Code Data Set* tutorial](https://docs.mongodb.com/manual/tutorial/aggregation-zip-code-data-set/)
* [MongoDB: *Write Scripts for the `mongo` Shell*`](https://docs.mongodb.com/manual/tutorial/write-scripts-for-the-mongo-shell/)
* [MongoDB: *Data Model Design*](https://docs.mongodb.com/manual/core/data-model-design)
  * Are you coming from a traditional SQL and relational background which favors a normalized data model? This page is
    an important one to read. It describes how idiomatic data model designs in Mongo are usually purposely de-normalized.
    In practice, this means "Store your data as embedded data in an existing document. Don't make a new collection!" (at
    least, that's my understanding so far).
    
