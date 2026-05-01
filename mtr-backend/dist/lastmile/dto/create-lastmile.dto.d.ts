export declare class AcceptDecisionDto {
    tableApplicationRowId: number;
    accepted: boolean;
    reason?: string;
}
export declare class AcceptApplicationDto {
    decisions: AcceptDecisionDto[];
}
