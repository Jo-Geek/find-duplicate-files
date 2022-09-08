import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fse from 'fs-extra';
import { Observable, Subject, Subscriber } from "rxjs";
import { IDuplicateFileProcessor } from "./interface/duplicateFileProcessor";
import { IDuplicateInfo } from "./interface/duplicateInfo";
import { ExecutionType, IProcessingOptions } from "./interface/ProcessiongOptions";
import { IExecutionEvent, IExecutionInfo } from './interface/executionInfo';
import { IFileInfo } from './interface/fileInfo';

// MB * bytes
const maxFileSize = 500 * 1024000;

export class DuplicateFileProcessor implements IDuplicateFileProcessor {
    private duplicateInfo: IDuplicateInfo;
    private executionInfo: IExecutionInfo;
    private scanProgressObservable: Observable<IDuplicateInfo>;
    private scanProgressSubscriber?: Subscriber<IDuplicateInfo>;
    private executionProgressObservable: Observable<IExecutionEvent>;
    private executionProgressSubscriber?: Subscriber<IExecutionEvent>;
    private filesList: IFileInfo[];
    private uniqueFiles: string[];
    private duplicateFiles: string[];
    private fileHashMap: any;
    private processingOptions: IProcessingOptions;
    private _isScanComplete: boolean;

    constructor(dir: string) {
        this.processingOptions = {
            scanDirectory: dir,
            executionType: ExecutionType.move,
            executionDirectory: path.join(dir, `/duplicates`)
        };

        this.duplicateInfo = {
            fileCurrentCount: 0,
            fileTotalCount: 0,
            fileGroupCount: 0,
            duplicatesCount: 0
        }

        this.executionInfo = {
            fileCurrentName: '',
            fileCurrentCount: 0,
            fileTotalCount: 0
        }

        this.scanProgressObservable = new Observable(subscriber => { this.scanProgressSubscriber = subscriber });
        this.executionProgressObservable = new Observable(subscriber => { this.executionProgressSubscriber = subscriber });
        this.filesList = [];
        this.uniqueFiles = [];
        this.duplicateFiles = [];
        this.fileHashMap = {};
        this._isScanComplete = false;

    }

    isScanComplete(): boolean {
        return this._isScanComplete;
    }

    getDuplicateInfo(): IDuplicateInfo {
        return this.duplicateInfo;
    }

    getExecutionInfo(): IExecutionInfo {
        return this.executionInfo;
    }

    getScanProgressEvent(): Observable<IDuplicateInfo> {
        return this.scanProgressObservable;
    }

    getExecutionProgressEvent(): Observable<IExecutionEvent> {
        return this.executionProgressObservable;
    }

    getFileGroups(): string[][] {
        let fileGroups: string[][] = [];
        Object.keys(this.fileHashMap).forEach(hash => {
            fileGroups.push(this.fileHashMap[hash]);
        });

        return fileGroups;
    }

    getUniqueFiles(): string[] {
        if (!this._isScanComplete) {
            throw new Error('File scan is not complete');
        }
        return this.uniqueFiles;
    }

    getDuplicateFiles(): string[] {
        if (!this._isScanComplete) {
            throw new Error('File scan is not complete');
        }
        return this.duplicateFiles;
    }

    getExecutionType(): ExecutionType {
        return this.processingOptions.executionType;
    }

    getExecutionDirectory(): string {
        return this.processingOptions.executionDirectory;
    }

    setExecutionType(executionType: ExecutionType): void {
        this.processingOptions.executionType = executionType
    }

    setExecutionDirectory(executionDirectory: string): void {
        this.processingOptions.executionDirectory = executionDirectory;
    }

    startScan(): void {
        this._isScanComplete = false;
        this.getAllFileDirents(this.processingOptions.scanDirectory).then(dirents => {
            let files = dirents.filter((dirent) => dirent.isFile()).map(dirent => dirent.name);
            this.filesList = [];
            files.forEach((file, index) => {
                this.filesList.push({
                    id: index,
                    name: file,
                    isTooBig: fse.statSync(path.join(this.processingOptions.scanDirectory, file)).size > maxFileSize,
                    isDuplicate: false
                });
            });

            if (this.filesList.length === 0) {
                throw new Error('No files found in directory');
            }

            this.duplicateInfo.fileTotalCount = this.filesList.length;
            //start process
            this.hashAndMap();
        }).catch(err => {
            throw err;
        });
    }

    startExecution(): void {
        if (!this._isScanComplete) {
            throw new Error('File scan is not complete');
        }

        this.executionInfo.fileTotalCount = this.duplicateInfo.duplicatesCount;

        switch (this.processingOptions.executionType) {
            case ExecutionType.delete:
                throw new Error('Not Implemented');
            // break;
            case ExecutionType.move:
            default:
                this.executeMove();
                break;
        }
    }

    private getAllFileDirents(dir: string): Promise<fs.Dirent[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, {
                withFileTypes: true
            }, (err, files) => {
                if (err) reject(err);
                resolve(files);
            });
        });
    }

    private hashAndMap(): void {
        this.filesList.forEach(fileInfo => {
            if (fileInfo.isTooBig) {
                console.log(`\nSkipped big file: ${fileInfo.name}`);
            }
            let hash = crypto.createHash('sha1').update(fse.readFileSync(path.join(this.processingOptions.scanDirectory, fileInfo.name))).digest('base64');
            if (this.fileHashMap[hash]) {
                this.duplicateInfo.duplicatesCount++;
                this.fileHashMap[hash] = [...this.fileHashMap[hash], fileInfo.name];
                //this.duplicateFiles.push(fileInfo.name);
            } else {
                this.duplicateInfo.fileGroupCount++;
                this.fileHashMap[hash] = [fileInfo.name];
                //this.uniqueFiles.push(fileInfo.name);
            }
            this.duplicateInfo.fileCurrentCount++;
            this.triggerScanProgessSubscriber();
        });
        this.triggerScanProgessSubscriber(true);
    }

    private processFileHashMap(){

    }

    private triggerScanProgessSubscriber(complete: boolean = false) {
        if (!complete) {
            this.scanProgressSubscriber?.next(this.duplicateInfo);
        } else {
            this._isScanComplete = true;
            this.processFileHashMap();
            this.scanProgressSubscriber?.complete();
        }
    }

    private executeMove(): void {
        if (!fs.existsSync(this.processingOptions.executionDirectory)) {
            fs.mkdirSync(this.processingOptions.executionDirectory, { recursive: true });
        }

        this.getDuplicateFiles().forEach(file => {
            this.executionInfo.fileCurrentName = file;
            this.executionInfo.fileCurrentCount++;
            try {
                fse.moveSync(path.join(this.processingOptions.scanDirectory, file), path.join(this.processingOptions.executionDirectory, file), {
                    overwrite: true
                });
                this.triggerExecutionProgessSubscriber(true);
            } catch (error) {
                this.triggerExecutionProgessSubscriber(false);
            }
        });
        this.triggerExecutionProgessSubscriber(true, true);
    }

    private triggerExecutionProgessSubscriber(success: boolean = true, complete: boolean = false) {
        if (!complete) {
            this.executionProgressSubscriber?.next({
                data: this.executionInfo,
                success
            });
        } else {
            this.executionProgressSubscriber?.complete();
        }
    }

}