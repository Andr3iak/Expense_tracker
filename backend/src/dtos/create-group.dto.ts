import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateGroupDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    icon?: string;

    @IsNumber()
    createdBy: number;
}