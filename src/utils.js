// subset of Object.assign
export function assign(object, ...hashes) {
  for (let i = 0; i < hashes.length; i++) {
    let hash = hashes[i];
    let keys = Object.keys(hash);

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      object[key] = hash[key];
    }
  }
  return object;
}

// Array.prototype.some
export function some(array, callback, thisArg=array) {
  for (let i = 0; i < array.length; i++) {
    let thing = array[i];
    if (callback.call(thisArg, thing)) {
      return true;
    }
  }
  return false;
}

export function every(array, ...rest) {
  return array.filter.apply(array, rest).length === array.length;
}
