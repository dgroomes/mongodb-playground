// Miscellaneous utility functions

/**
 * Pretty format JSON.
 */
function prettyJson(obj) {
  return JSON.stringify(obj, null, 2);
}

/**
 * Pretty format JSON and print it to the console
 */
function printPrettyJson(obj) {
  console.log(prettyJson(obj))
}

module.exports = {
  printPrettyJson
}
