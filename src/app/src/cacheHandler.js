import React, { useState, useEffect } from "react";
import packageJson from "../package.json";
import moment from "moment";

const checkBuildDate = (latestDate, currentDate) => {
  const momLatestDateTime = moment(latestDate);
  const momCurrentDateTime = moment(currentDate);

  if (momLatestDateTime.isAfter(momCurrentDateTime)) {
    return true;
  } else {
    return false;
  }
};

function clearCache(Component) {
  function ClearCacheComponent(props) {
    const [isLatestBuildDate, setIsLatestBuildDate] = useState(false);

    useEffect(() => {
      fetch("/meta.json")
        .then((response) => response.json())
        .then((meta) => {
          const latestVersionDate = meta.buildDate;
          const currentVersionDate = packageJson.buildDate;

          const shouldForceRefresh = checkBuildDate(
            latestVersionDate,
            currentVersionDate
          );
          if (shouldForceRefresh) {
            setIsLatestBuildDate(false);
            refreshCacheAndReload();
          } else {
            setIsLatestBuildDate(true);
          }
        });
    }, []);

    const refreshCacheAndReload = () => {
      if (caches) {
        caches.keys().then(async function (names) {
          await Promise.all(names.map((name) => caches.delete(name)));
        });
      }
      window.location.reload();
    };

    return <>{isLatestBuildDate ? <Component {...props} /> : null}</>;
  }

  return ClearCacheComponent;
}

export default clearCache;
