# mongodb-playground

📚 Learning and exploring MongoDB.

Note: this was developed on macOS.

## Instructions

As a pre-requisite, you must install Mongo. See the [Installing Mongo](#installing-mongo) section for options.

1. Start the MongoDB server
1. Load the database with Zip Code test data (this is from the official Mongo site):
   * `mongoimport data/zips.json`
1. Start a shell session:
   * `mongo`
1. Switch to the `test` database (this is the database with the Zip Code data)
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

It should print `29353` in the terminal.

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
* Do something with "aggregation pipelines"

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
    
