export enum ExecutionType {
    delete, move
}

export interface IProcessingOptions {
    scanDirectory: string;
    executionType: ExecutionType;
    executionDirectory: string;
}