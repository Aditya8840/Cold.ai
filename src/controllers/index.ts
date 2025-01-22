import path from 'path';
import glob from 'glob';

const basename: string = path.basename(__filename);
const controllers: Record<string, unknown> = {};

glob
  .sync(`${__dirname}/**/*.js`)
  .filter((file: string) => {
    const fileName: string[] = file.split('/');
    return (
      fileName[fileName.length - 1].indexOf('.') !== 0 &&
      fileName[fileName.length - 1] !== basename &&
      fileName[fileName.length - 1].slice(-3) === '.js'
    );
  })
  .forEach(async (file: string) => {
    const fileName: string[] = file.split('/');
    const controllerName: string = fileName[fileName.length - 1].slice(0, -3);
    controllers[controllerName] = await import(file);
  });

export default controllers;