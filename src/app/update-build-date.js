const fs = require("fs");
var localStorageVersionPath = "./src/localStorage_version.json";

const jsonContent = {
  version: 1,
};

try {
  if (!fs.existsSync(localStorageVersionPath)) {
    fs.writeFile(
      localStorageVersionPath,
      JSON.stringify(jsonContent),
      "utf8",
      function (error) {
        if (error) {
          console.log(
            "An error occured while saving build date and time to localStorage_version.json"
          );
          return console.log(error);
        }

        console.log(
          "Latest build date and time updated in localStorage_version.json file"
        );
      }
    );
    return;
  }
  var localStorageVersion = JSON.parse(
    fs.readFileSync(localStorageVersionPath).toString()
  );
  var newLocalStorageVersion = ++localStorageVersion.version;
  const newSetupVersion = { version: newLocalStorageVersion };
  fs.writeFileSync(localStorageVersionPath, JSON.stringify(newSetupVersion));
  console.log(
    "Latest build date and time updated in localStorage_version.json file with new version"
  );
} catch (err) {
  console.error(err);
}
