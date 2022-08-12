import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Observable, Subject, Subscriber } from "rxjs";
import { IDuplicateFileProcesssor } from "./interface/duplicateFileProcessor";
import { IDuplicateInfo } from "./interface/duplicateInfo";
import { IOptions } from "./interface/options";

export class DuplicateFileProcessor implements IDuplicateFileProcesssor {
    private directory: string;
    private duplicateInfo: IDuplicateInfo;
    private fileProgressObservable: Observable<IDuplicateInfo>;
    private fileProgressSubscriber?: Subscriber<IDuplicateInfo>;
    private filesList: string[];
    private fileHashMap: any;

    constructor(dir: string) {
        this.directory = dir
        this.fileProgressObservable = new Observable(subscriber => { this.fileProgressSubscriber = subscriber });
        this.duplicateInfo = {
            fileCurrentCount: 0,
            fileTotalCount: 0,
            fileGroupCount: 0,
            duplicatesCount: 0
        }
        this.filesList = [];
        this.fileHashMap = {};
    }

    getDuplicateInfo(): IDuplicateInfo {
        return this.duplicateInfo;
    }

    getFileProgressEvent(): Observable<IDuplicateInfo> {
        return this.fileProgressObservable;
    }

    getFileGroups(): string[][] {
        let fileGroups: string[][] = [];
        Object.keys(this.fileHashMap).forEach(hash => {
            fileGroups.push(this.fileHashMap[hash]);
        });

        return fileGroups;
    }

    startScan(): void {
        this.getAllFileDirents(this.directory).then(dirents => {
            this.filesList = dirents.filter((dirent) => dirent.isFile()).map(dirent => dirent.name);

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
        this.filesList.forEach(file => {
            let hash = crypto.createHash('sha1').update(fs.readFileSync(path.join(this.directory, file))).digest('base64');
            if (this.fileHashMap[hash]) {
                this.duplicateInfo.duplicatesCount++;
                this.fileHashMap[hash] = [...this.fileHashMap[hash], file];
            } else {
                this.duplicateInfo.fileGroupCount++;
                this.fileHashMap[hash] = [file];
            }
            this.duplicateInfo.fileCurrentCount++;
            this.triggerFileProgessSubscriber();
        });
        this.triggerFileProgessSubscriber(true);
    }

    private triggerFileProgessSubscriber(complete: boolean = false) {
        if (!complete) {
            this.fileProgressSubscriber?.next(this.duplicateInfo);
        } else {
            this.fileProgressSubscriber?.complete();
        }
    }

}