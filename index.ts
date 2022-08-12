import * as minimist from 'minimist';
import { IDuplicateInfo } from './src/interface/duplicateInfo';
import { IConsoleParams } from './src/interface/consoleParams';
import { DuplicateFileProcessor } from './src/core';

// get arguments
var params: IConsoleParams = minimist((process.argv.slice(2)));
params.dir = 'C:/Users/ra4272/Downloads';
if (params.dir) {

  try {
    let duplicateFileProcessor = new DuplicateFileProcessor(params.dir);
    duplicateFileProcessor.getFileProgressEvent().subscribe({
      next: writeDuplicateInfo,
      complete: () => { fileScanningComplete(duplicateFileProcessor); }
    });
    writeDuplicateInfo(duplicateFileProcessor.getDuplicateInfo(), false);
    duplicateFileProcessor.startScan();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
} else {
  console.error('Directory not provided. Use --dir to provide directory');
  process.exitCode = 1;
}

function writeDuplicateInfo(duplicateInfo: IDuplicateInfo, overwrite: boolean = true) {
  overwrite && process.stdout.cursorTo(0);
  process.stdout.write(`Files processed: ${duplicateInfo.fileCurrentCount}/${duplicateInfo.fileTotalCount} | File groups:${duplicateInfo.fileGroupCount} | Duplicates found: ${duplicateInfo.duplicatesCount}`);
}

function fileScanningComplete(duplicateFileProcessor: DuplicateFileProcessor) {
  writeDuplicateInfo(duplicateFileProcessor.getDuplicateInfo());
  console.log('\nAll files scanned\n');
  if (params.list) {
    listFileGroups(duplicateFileProcessor);
  }
}

function listFileGroups(duplicateFileProcessor: DuplicateFileProcessor) {
  let i = 1;
  console.log('\n\nFile Groups:');
  duplicateFileProcessor.getFileGroups().forEach(files => {
    console.log(`\n${i}. ${files[0]}`);
    if (files.length > 1) {
      for (var j = 1; j < files.length; j++) {
        console.log(`\t- ${files[j]}`);
      }
    }
    i++;
  });
}