import * as minimist from 'minimist';
import { IDuplicateInfo } from './src/interface/duplicateInfo';
import { IConsoleParams } from './src/interface/consoleParams';
import { DuplicateFileProcessor } from './src/core';
import { ExecutionType } from './src/interface/ProcessiongOptions';
import { IExecutionEvent } from './src/interface/executionInfo';

// get arguments
var params: IConsoleParams = minimist((process.argv.slice(2)));
params.dir = 'C:/Users/ra4272/Downloads';
if (params.dir) {

  try {
    let duplicateFileProcessor = new DuplicateFileProcessor(params.dir);
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

function fileScanningComplete(duplicateFileProcessor: DuplicateFileProcessor) {
  writeDuplicateInfo(duplicateFileProcessor.getDuplicateInfo());
  console.log('\nAll files scanned\n');

  if (params.list) {
    listFileGroups(duplicateFileProcessor);
  }

  if (params.execute) {
    console.log(`\nExecuting operation: ${ExecutionType[duplicateFileProcessor.getExecutionType()]}`);
    duplicateFileProcessor.startExecution();
  }
}

function writeExecutionInfo(event: IExecutionEvent, overwrite: boolean = true) {
  if (event.success) {
    overwrite && process.stdout.cursorTo(0);
    process.stdout.write(`Processing: ${event.data.fileCurrentCount}/${event.data.fileTotalCount} | File: ${event.data.fileCurrentName}`);
  } else {
    console.log(`Execution failed for file: ${event.data.fileCurrentName}`);
  }
}

function fileExecutionComplete(duplicateFileProcessor: DuplicateFileProcessor) {
  writeExecutionInfo({
    data: duplicateFileProcessor.getExecutionInfo(),
    success: true
  });

  console.log('\nExecution completed\n');
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