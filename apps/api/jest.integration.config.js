// Cargar TZ del .env en el proceso principal: los workers de Jest lo heredan.
// Sin esto, la zona depende del sistema (en CI está bien, en local no).
require('dotenv').config();

/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.integration\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  // Los specs comparten una sola BD: en paralelo se pisan (una suite borra
  // máquinas mientras otra simula GPS, o cambia el turno de ventas).
  maxWorkers: 1,
  testTimeout: 30000,
  forceExit: true,
};
