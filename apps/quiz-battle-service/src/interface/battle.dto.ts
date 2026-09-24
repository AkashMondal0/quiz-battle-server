import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MinLength(1)
  requestId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  topic!: string;

  @IsString()
  aiModelId!: string;

  @IsString()
  aiBackendId!: string;

  @IsString()
  gameMode!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  playerCount!: number;

  @IsString()
  difficulty!: string;

  @IsInt()
  @Min(1)
  @Max(50)
  questionCount!: number;

  @IsInt()
  @Min(5)
  @Max(300)
  secondsPerQuestion!: number;

  @IsBoolean()
  isPrivate!: boolean;
}

export class JoinRoomDto {
  @IsString()
  @MinLength(1)
  roomId!: string;

  @IsOptional()
  @IsString()
  requestId?: string;
}

export class ReadyDto {
  @IsBoolean()
  ready!: boolean;

  @IsString()
  @MinLength(1)
  roomId!: string;
}

export class RoomIdDto {
  @IsString()
  @MinLength(1)
  roomId!: string;
}

export class AnswerDto {
  @IsString()
  @MinLength(1)
  roomId!: string;

  @IsString()
  @MinLength(1)
  oId!: string;

  @IsString()
  @MinLength(1)
  qId!: string;
}