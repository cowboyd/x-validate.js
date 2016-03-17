// subset of Object.assign
export function assign(object, ...hashes) {
  for (let i = 0; i < hashes.length; i++) {
    let hash = hashes[i];
    for (let key in hash) {
      object[key] = hash[key];
    }
  }
  return object;
}

// Array.prototype.some
export function some(array, ...rest) {
  return array.filter.apply(array, rest).length > 0;
}

export function every(array, ...rest) {
  return array.filter.apply(array, rest).length === array.length;
}
