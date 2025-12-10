import { IsString, IsNotEmpty, IsArray, IsOptional, MinLength } from 'class-validator';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(15)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(30)
  content: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
