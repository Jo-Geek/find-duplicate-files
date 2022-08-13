export interface IExecutionInfo {
    fileCurrentName: string;
    fileCurrentCount: number;
    fileTotalCount: number;
}

export interface IExecutionEvent {
    data: IExecutionInfo,
    success: boolean
}