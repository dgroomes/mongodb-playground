# mongodb-playground

NOT YET FULLY IMPLEMENTED

📚 Learning and exploring MongoDB.

## Instructions

As a pre-requisite, you must install Mongo. See the [Installing Mongo](#installing-mongo) section for options.

1. Start Mongo
1. Load the database with test data:
   * `TODO`
1. Query the database:
   * `TODO`
1. Stop Mongo

### Installing Mongo

There are various options for getting up and running with MongoDB locally. The most direct way is to download MongoDB
from the official website (see the relevant link under [Reference materials](#referenced-materials)) or via HomeBrew. You
should then follow the additional documentation on the MongoDB site to learn how to create a data directory, start the
MongoDB server, start an interactive shell session using the `mongo` command, and stop the MongoDB server.

An alternative option is to run a MongoDB server using Docker. There is a `docker-compose.yml` file in this project to help
accomplish that. Using the Docker option, you can do the following:

* Start a MongoDB server with `docker-compose up --detach`
* Enter an interactive `mongo` shell session with `docker exec -it mongodb-playground_mongo_1 mongo`
  * NOTE: while this option is clever, it would pay off to install Mongo so that you can use the `mongo` command directly
    to start a shell session instead of this extra-ness of starting a session via the Docker container. The strength of
    the "Mongo-via-Docker" option is in running the *server* and handling the data directory in a convenient way to the user.
    Whereas starting a shell session (*client*) is more convenient with `mongo` compared to the long-hand `docker exec...` alternative. 
* Stop the server with `docker-compose down`

## Wish List

General clean-ups, TODOs and things I wish to implement for this project:

* Create test data and load it into Mongo
* Create some test queries
* Do something with "aggregation pipelines"

## Referenced materials

* [MongoDB: download *Community Server*](https://www.mongodb.com/try/download/community)
* [MongoDB: run the `mongod` process](https://docs.mongodb.com/manual/tutorial/manage-mongodb-processes/)
