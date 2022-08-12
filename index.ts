import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as minimist from 'minimist';
import { parseCommandLine } from 'typescript';

interface IParams {
  _: any[];
  dir?: string;
  list?: boolean;
  execute?: boolean;
}

interface IDuplicateInfo {
  fileCurrentCount: number;
  fileTotalCount: number;
  duplicatesCount: number;
  fileGroupCount: number;
}

const fileHashes = {};
var fileList: string[];
const duplicateInfo: IDuplicateInfo = {
  fileCurrentCount: 0,
  fileTotalCount: 0,
  duplicatesCount: 0,
  fileGroupCount: 0
};
// get arguments
var params: IParams = minimist((process.argv.slice(2)));
params.dir = '//INPC3325/Users/Public/Recovered Pictures/Asus Zenfone';
if (params.dir) {
  getFileNames(params.dir).then(list => {

    if (list.length === 0) {
      console.log('No files found in directory');
      return;
    }

    duplicateInfo.fileTotalCount = list.length;
    fileList = list;
    writeDuplicateInfo();
    //start process
    hashAndStore(fileList);
    if (params.list) {
      listFilrGroups();
    }
  }).catch((err: NodeJS.ErrnoException) => {
    console.error(err.message);
    process.exitCode = 1;
  });
} else {
  console.error('Directory not provided. Use --dir to provide directory');
  process.exitCode = 1;
}

function getFileNames(imgFolder: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(imgFolder, (err, files) => {
      if (err) reject(err);
      resolve(files);
    });
  });
}

function hashAndStore(fileList: string[]) {
  fileList.forEach(file => {
    let hash = crypto.createHash('sha1').update(fs.readFileSync(path.join(params.dir, file))).digest('base64');
    if (fileHashes[hash]) {
      duplicateInfo.duplicatesCount++;
      fileHashes[hash] = [...fileHashes[hash], file];
    } else {
      duplicateInfo.fileGroupCount++;
      fileHashes[hash] = [file];
    }
    duplicateInfo.fileCurrentCount++;
    writeDuplicateInfo();
  });
}

function writeDuplicateInfo() {
  console.clear();
  console.log(`Files processed: ${duplicateInfo.fileCurrentCount}/${duplicateInfo.fileTotalCount}\nFile groups:${duplicateInfo.fileGroupCount}\nDuplicates found: ${duplicateInfo.duplicatesCount}`);
}

function listFilrGroups() {
  let i = 1;
  console.log('\n\nFile Groups:');
  Object.keys(fileHashes).forEach(hash => {
    let files = fileHashes[hash];
    console.log(`\n${i}. ${files[0]}`);
    if (files.length > 1) {
      for (var j = 1; j < files.length; j++) {
        console.log(`\t- ${files[j]}`);
      }
    }
    i++;
  });
}