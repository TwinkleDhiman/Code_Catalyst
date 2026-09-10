import fs from 'fs';
import path from 'path';
import { transformSync } from '@babel/core';
import prettier from 'prettier';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const srcDir = path.join(__dirname, 'src');
const files = walkSync(srcDir);

for (const file of files) {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Convert tsx/ts to jsx/js
    const result = transformSync(content, {
      filename: file,
      presets: [
        ['@babel/preset-typescript', { isTSX: file.endsWith('.tsx'), allExtensions: true }]
      ],
      plugins: ['@babel/plugin-syntax-jsx'],
      retainLines: true,
      generatorOpts: {
        retainLines: true
      }
    });

    if (result && result.code) {
      let code = result.code;
      // Prettify
      try {
        code = prettier.format(code, { parser: 'babel', singleQuote: true, trailingComma: 'es5' });
      } catch (e) {
        console.error('Prettier failed on', file, e);
      }
      
      const newFile = file.replace(/\.tsx$/, '.jsx').replace(/\.ts$/, '.js');
      fs.writeFileSync(newFile, code, 'utf-8');
      fs.unlinkSync(file);
      console.log(`Converted ${file} to ${newFile}`);
    }
  }
}
