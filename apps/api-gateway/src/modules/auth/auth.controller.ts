import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common'
import { LoginUseCase, RefreshTokenUseCase, InvalidCredentialsError } from '@aura/application'
import { DomainError } from '@aura/domain'
import { LoginDto, RefreshTokenDto } from './dto/auth.dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    try {
      return await this.loginUseCase.execute(dto)
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        throw new UnauthorizedException(err.message)
      }
      throw err
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    try {
      return await this.refreshTokenUseCase.execute(dto.refreshToken)
    } catch (err) {
      if (err instanceof DomainError) {
        throw new UnauthorizedException(err.message)
      }
      throw err
    }
  }
}