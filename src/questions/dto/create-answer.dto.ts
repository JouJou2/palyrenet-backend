import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateAnswerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(30)
  content: string;
}
