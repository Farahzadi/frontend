import localStorageVersion from "../../local_storage_version.json";

export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * @dev
 * checkLocalStorageVersion is checking localStorage version and clear it if needed
 */

export const checkLocalStorageVersion = () => {
  const localStorageVersionKey = "localStorageVersion";
  const currentVersion = JSON.parse(
    localStorage.getItem(localStorageVersionKey)
  )?.version;
  const lastVersion = localStorageVersion.version;

  if (currentVersion !== lastVersion) {
    localStorage.clear();
    localStorage.setItem(
      localStorageVersionKey,
      JSON.stringify(localStorageVersion)
    );
  }
};
