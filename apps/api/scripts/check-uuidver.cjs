const { isUUID } = require('class-validator');
const id = 'c2000000-0000-0000-0000-000000000001';
for (const ver of ['all', '3', '4', '5', '7']) {
  try {
    console.log(ver, '->', isUUID(id, ver));
  } catch (e) {
    console.log(ver, '-> ERROR', e.message);
  }
}
console.log('sin versión:', isUUID(id));
