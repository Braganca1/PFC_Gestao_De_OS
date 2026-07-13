import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { Public } from './public.decorator';
import { CurrentUser, UsuarioAutenticado } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.senha);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  loginGoogle(@Body() dto: GoogleLoginDto) {
    return this.authService.loginGoogle(dto.idToken);
  }

  @Get('me')
  me(@CurrentUser() user: UsuarioAutenticado) {
    return this.authService.me(user.sub);
  }
}
