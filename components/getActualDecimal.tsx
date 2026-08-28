const formatLargeNumber = (number: number) => {
  if (number >= 1e9) {
    return (number / 1e9).toFixed(2) + "B";
  } else if (number >= 1e6) {
    return (number / 1e6).toFixed(2) + "M";
  } else if (number >= 1e3) {
    return (number / 1e3).toFixed(2) + "K";
  } else {
    return number.toFixed(2);
  }
};
const formatLargeNumberWithoutDecimals = (number: number) => {
  if (number >= 1e9) {
    return (number / 1e9).toFixed(0) + "B";
  } else if (number >= 1e6) {
    return (number / 1e6).toFixed(0) + "M";
  } else if (number >= 1e3) {
    return (number / 1e3).toFixed(0) + "K";
  } else {
    return number;
  }
};
export { formatLargeNumber, formatLargeNumberWithoutDecimals };
