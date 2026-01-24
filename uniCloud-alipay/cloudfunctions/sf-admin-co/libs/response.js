function fail(errMsg, errCode = -1) {
  return {
    errMsg,
    errCode
  }
}

module.exports = {
  fail
};
