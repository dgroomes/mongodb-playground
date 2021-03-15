#!/usr/bin/env bash

doImport1() {
  mongoimport --db test --collection zips <(sed -n '1,10000p;10001q' zips.json)
}

doImport2() {
  mongoimport --db test --collection zips <(sed -n '10001,20000p;20001q' zips.json)
}

doImport3() {
  mongoimport --db test --collection zips <(sed -n '20001,29353p' zips.json)
}

doAvg() {
  node src/zips-averages.js
}

doAvgInc() {
  node src/zips-averages-incremental.js
}

doDropAll() {
  mongo --quiet --eval '
    db.app_meta_data.drop()
    db.zips.drop()
    db.zips_avg_pop_by_city.drop()
    db.zips_avg_pop_by_state.drop()
    db.zips_grouped_by_city.drop()
    db.zips_grouped_by_state.drop()'
}
