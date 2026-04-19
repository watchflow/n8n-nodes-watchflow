const { src, dest } = require("gulp");

function copyIcons() {
  src("nodes/**/*.svg").pipe(dest("dist/nodes/"));
  return src("credentials/**/*.svg").pipe(dest("dist/credentials/"));
}

exports["build:icons"] = copyIcons;
