import { Controller, Post, Body, Get, UseGuards, Request, Patch, Param, Query, UseInterceptors, UploadedFile, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, updateProfileDto);
  }

  @Get('search')
  async searchUsers(@Query('q') query: string) {
    return this.authService.searchUsers(query);
  }

  @Get('user/:id')
  async getUserById(@Param('id') id: string) {
    return this.authService.getUserById(id);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Post('upload-avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `avatar-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    }),
  )
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const url = `http://localhost:3001/uploads/avatars/${file.filename}`;
      await this.authService.updateProfile(req.user.id, { avatarUrl: url });
      return { success: true, url };
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload avatar');
    }
  }

  @Post('upload-cover')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/covers',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `cover-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async uploadCover(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const url = `http://localhost:3001/uploads/covers/${file.filename}`;
      await this.authService.updateProfile(req.user.id, { coverUrl: url });
      return { success: true, url };
    } catch (error) {
      throw new InternalServerErrorException('Failed to upload cover');
    }
  }

  @Patch('promote-to-admin/:userId')
  @UseGuards(JwtAuthGuard)
  async promoteToAdmin(@Request() req, @Param('userId') userId: string, @Body() body: { password: string }) {
    const currentUser = await this.authService.getUserById(req.user.id);
    if (!currentUser || currentUser.role !== 'ADMIN') {
      throw new BadRequestException('Only admins can promote users');
    }
    
    // Verify admin password
    if (!body.password) {
      throw new BadRequestException('Password is required');
    }
    const passwordValid = await this.authService.verifyPassword(req.user.id, body.password);
    if (!passwordValid) {
      throw new BadRequestException('Invalid password');
    }
    
    return this.authService.promoteToAdmin(userId);
  }
}
