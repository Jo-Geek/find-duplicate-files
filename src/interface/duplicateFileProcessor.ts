import { Observable } from "rxjs";
import { IDuplicateInfo } from "./duplicateInfo";
import { IExecutionEvent, IExecutionInfo } from "./executionInfo";
import { ExecutionType, IProcessingOptions } from "./ProcessiongOptions";

export interface IDuplicateFileProcessor {
    getFileGroups(): string[][];
    getUniqueFiles(): string[];
    getDuplicateFiles(): string[];
    getDuplicateInfo(): IDuplicateInfo;
    getExecutionInfo(): IExecutionInfo;
    getScanProgressEvent(): Observable<IDuplicateInfo>;
    getExecutionProgressEvent(): Observable<IExecutionEvent>;
    getExecutionType(): ExecutionType;
    getExecutionDirectory(): string;

    setExecutionType(executionType: ExecutionType): void;
    setExecutionDirectory(executionDirectory: string): void;

    startScan(): void;
    startExecution(): void;

    isScanComplete(): boolean;
}