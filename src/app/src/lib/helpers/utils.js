import moment from "moment";

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
