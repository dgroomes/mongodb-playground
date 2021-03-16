// Utility functions

const fs = require("fs")
const readline = require("readline")

/**
 * Create a "readline" object that can be iterated over.
 *
 * Taken straight from the Node.js docs. https://nodejs.org/api/readline.html#readline_example_read_file_stream_line_by_line
 * @return {Promise<void>}
 */
function lines(file) {
  const fileStream = fs.createReadStream(file)

  return readline.createInterface({
    input: fileStream,
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.
    crlfDelay: Infinity
  })
}

module.exports = {
  lines
}
