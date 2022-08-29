import * as minimist from 'minimist';
import { IDuplicateInfo } from './src/interface/duplicateInfo';
import { IConsoleParams } from './src/interface/consoleParams';
import { DuplicateFileProcessor } from './src/core';
import { ExecutionType } from './src/interface/ProcessiongOptions';
import { IExecutionEvent } from './src/interface/executionInfo';
import { IDuplicateFileProcessor } from './src/interface/duplicateFileProcessor';

// get cli arguments
var params: IConsoleParams = minimist((process.argv.slice(2)));
// To debug
//params.dir = 'C:/Users/xxxxx/Downloads';
if (params.dir) {
  try {
    let duplicateFileProcessor: IDuplicateFileProcessor = new DuplicateFileProcessor(params.dir);
    duplicateFileProcessor.getScanProgressEvent().subscribe({
      next: writeDuplicateInfo,
      complete: () => { fileScanningComplete(duplicateFileProcessor); }
    });
    duplicateFileProcessor.getExecutionProgressEvent().subscribe({
      next: writeExecutionInfo,
      complete: () => { fileExecutionComplete(duplicateFileProcessor) }
    })
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
  process.stdout.write(`Files scanned: ${duplicateInfo.fileCurrentCount}/${duplicateInfo.fileTotalCount} | Unique Files: ${duplicateInfo.fileGroupCount} | Duplicates found: ${duplicateInfo.duplicatesCount}`);
}

function fileScanningComplete(duplicateFileProcessor: IDuplicateFileProcessor) {
  writeDuplicateInfo(duplicateFileProcessor.getDuplicateInfo());
  console.log('\nAll files scanned\n');

  if (params.list) {
    listFileGroups(duplicateFileProcessor);
  }

  if (params.execute) {
    if (duplicateFileProcessor.getDuplicateFiles().length > 0) {
      console.log(`\nExecuting operation: ${ExecutionType[duplicateFileProcessor.getExecutionType()]}`);
      duplicateFileProcessor.startExecution();
    } else {
      console.log('No duplicate files found to process');
    }
  }
}

function writeExecutionInfo(event: IExecutionEvent) {
  console.log(`[${padZeros(event.data.fileCurrentCount, event.data.fileTotalCount)}/${event.data.fileTotalCount}]\t${event.success ? 'DONE' : 'FAIL'}\t${event.data.fileCurrentName}`);

}

function fileExecutionComplete(duplicateFileProcessor: IDuplicateFileProcessor) {
  console.log('\nExecution completed\n');
}

function listFileGroups(duplicateFileProcessor: IDuplicateFileProcessor) {
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

function padZeros(source: number, target: number): string {
  return `${source}`.padStart(`${target}`.length, `0`);
}