const fs = require("fs");
const blog_idl = require("./target/idl/s3_dapp_solana.json");

fs.writeFileSync("./app/src/idl.json", JSON.stringify(blog_idl, null, 2));