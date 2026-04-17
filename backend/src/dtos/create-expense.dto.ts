import { IsNumber, IsString, IsArray } from 'class-validator';

export class CreateExpenseDto {
    @IsNumber()
    amount: number;

    @IsString()
    description: string;

    @IsNumber()
    paidBy: number;

    @IsArray()
    @IsNumber({}, { each: true })
    participantIds: number[]; // ← вместо participants
}