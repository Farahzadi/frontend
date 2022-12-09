import moment from "moment";

import localStorageVersion from "../../localStorage_version.json";

export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Function returning the build date(as per provided epoch)
 * @param date Time in milliseconds
 */
export const getBuildDate = (date) => {
  const buildDate = moment(date).format("DD-MM-YYY HH:MM");
  return buildDate;
};

export const checkLocalStorageVersion = () => {
  const localStorageVersionKey = "localStorageVersion";
  const currentVersion = JSON.parse(
    localStorage.getItem(localStorageVersionKey)
  ).version;
  const lastVersion = localStorageVersion.version;
  if (currentVersion) {
    if (currentVersion !== lastVersion) {
      localStorage.clear();

      localStorage.setItem(
        localStorageVersionKey,
        JSON.stringify(localStorageVersion)
      );
    }
  } else {
    localStorage.setItem(
      localStorageVersionKey,
      JSON.stringify(localStorageVersion)
    );
  }
};
