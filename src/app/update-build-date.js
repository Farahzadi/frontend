const fs = require("fs");
const packageJsonPath = "./package.json";

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString());
packageJson.buildDate = new Date().getTime();

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

const jsonData = {
  buildDate: packageJson.buildDate,
};

const jsonContent = JSON.stringify(jsonData);

fs.writeFile("./public/meta.json", jsonContent, "utf8", function (error) {
  if (error) {
    console.log(
      "An error occured while saving build date and time to meta.json"
    );
    return console.log(error);
  }

  console.log("Latest build date and time updated in meta.json file");
});
