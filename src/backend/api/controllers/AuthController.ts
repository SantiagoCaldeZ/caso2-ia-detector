import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { RegisterRequestDTO } from '../dto/auth/RegisterRequestDTO';
import { LoginRequestDTO } from '../dto/auth/LoginRequestDTO';
import { UserDTO } from '../dto/auth/UserDTO';
import { AuthResponseDTO } from '../dto/auth/AuthResponseDTO';
import { AuthenticatedRequest } from '../dto/auth/AuthenticatedRequest';
import { JwtAuthGuard } from '../guards/JwtAuthGuard';
import { RegisterService } from '../../application/auth/RegisterService';
import { LoginService } from '../../application/auth/LoginService';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerService: RegisterService,
    private readonly loginService: LoginService,
  ) {}

  @Post('register')
  register(@Body() body: RegisterRequestDTO): Promise<UserDTO> {
    return this.registerService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginRequestDTO): Promise<AuthResponseDTO> {
    return this.loginService.login(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getCurrentUser(@Req() request: AuthenticatedRequest): UserDTO {
    return request.user;
  }
}