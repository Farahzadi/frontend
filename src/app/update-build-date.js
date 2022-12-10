const fs = require("fs");
var localStorageVersionPath = "./src/local_storage_version.json";

const jsonContent = {
  version: 1,
};

try {
  if (!fs.existsSync(localStorageVersionPath)) {
    try {
      fs.writeFileSync(localStorageVersionPath, JSON.stringify(jsonContent));
      console.log(
        "Latest build date and time updated in local_storage_version.json file"
      );
    } catch (err) {
      console.error(
        "An error occured while saving build date and time to local_storage_version.json",
        err
      );
    }
    return;
  }
  var localStorageVersion = JSON.parse(
    fs.readFileSync(localStorageVersionPath).toString()
  );
  var newLocalStorageVersion = ++localStorageVersion.version;
  const newSetupVersion = { version: newLocalStorageVersion };
  fs.writeFileSync(localStorageVersionPath, JSON.stringify(newSetupVersion));
  console.log(
    "Latest build date and time updated in local_storage_version.json file with new version"
  );
} catch (err) {
  console.error(err);
}
