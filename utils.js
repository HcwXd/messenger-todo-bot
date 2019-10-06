module.exports = {
  dCopy: (obj) => {
    if (obj === null) {
      return null;
    }

    if (obj === undefined) {
      return undefined;
    }

    let val;
    const ret = Array.isArray(obj) ? [] : {};
    Object.keys(obj).forEach((key) => {
      val = obj[key];
      ret[key] = typeof val === 'object' ? dCopy(val) : val;
    });
    return ret;
  },
  replaceArrayItemByIndex: (array, idx, newItem) => {
    const ret = array.slice(0);
    ret[idx] = newItem;
    return ret;
  },
};
