// Find the size of the "zips" collection

db = db.getSiblingDB('test')
let size = db.zips.find().size()
print(size)
