import { Observable } from "rxjs";
import { IDuplicateInfo } from "./duplicateInfo";
import { IOptions } from "./options";

export interface IDuplicateFileProcesssor {
    getFileGroups(): string[][];
    getDuplicateInfo(): IDuplicateInfo;
    getFileProgressEvent(): Observable<IDuplicateInfo>;

    startScan(): void;
}