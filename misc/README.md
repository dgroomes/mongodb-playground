# misc

Miscellaneous notes, data and scripts. This is *not* a cohesive sub-project.

## Notes

* Import all of the ZIP code data files with this command:
  ```
  mongoimport --db test --collection zips <(cat data/zips_*)
  ```
