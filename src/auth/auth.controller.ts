import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Patch,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

// ✅ Custom Multer file type (works everywhere)
type MulterFile = {
  originalname: string;
  encoding: string;
  mimetype: string;
  filename: string;
  size: number;
  buffer?: Buffer;
};

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
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `avatar-${unique}${extname(file.originalname)}`);
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
  async uploadAvatar(@Request() req, @UploadedFile() file: MulterFile) {   // ✅ FIXED
    if (!file) throw new BadRequestException('No file uploaded');

    try {
      const url = `http://localhost:3001/uploads/avatars/${file.filename}`;
      await this.authService.updateProfile(req.user.id, { avatarUrl: url });
      return { success: true, url };
    } catch (e) {
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
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `cover-${unique}${extname(file.originalname)}`);
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
  async uploadCover(@Request() req, @UploadedFile() file: MulterFile) {   // ✅ FIXED
    if (!file) throw new BadRequestException('No file uploaded');

    try {
      const url = `http://localhost:3001/uploads/covers/${file.filename}`;
      await this.authService.updateProfile(req.user.id, { coverUrl: url });
      return { success: true, url };
    } catch (e) {
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

    if (!body.password) throw new BadRequestException('Password is required');

    const isValid = await this.authService.verifyPassword(req.user.id, body.password);
    if (!isValid) throw new BadRequestException('Invalid password');

    return this.authService.promoteToAdmin(userId);
  }
}
