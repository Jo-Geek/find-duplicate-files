import { Observable } from "rxjs";
import { IDuplicateInfo } from "./duplicateInfo";
import { IExecutionInfo } from "./executionInfo";
import { ExecutionType, IProcessingOptions } from "./ProcessiongOptions";

export interface IDuplicateFileProcesssor {
    getFileGroups(): string[][];
    getUniqueFiles(): string[];
    getDuplicateFiles(): string[];
    getDuplicateInfo(): IDuplicateInfo;
    getExecutionInfo(): IExecutionInfo;
    getScanProgressEvent(): Observable<IDuplicateInfo>;
    getExecutionType(): ExecutionType;
    getExecutionDirectory(): string;

    setExecutionType(executionType: ExecutionType): void;
    setExecutionDirectory(executionDirectory: string): void;

    startScan(): void;
    startExecution(): void;
}