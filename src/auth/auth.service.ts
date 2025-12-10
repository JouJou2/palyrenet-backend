import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password, fullName } = registerDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with all profile fields
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        fullName,
        country: registerDto.country,
        city: registerDto.city,
        university: registerDto.university,
        academicPosition: registerDto.academicPosition,
        highestDegree: registerDto.highestDegree,
        bio: registerDto.bio,
        fieldsOfStudy: registerDto.fieldsOfStudy || [],
        skills: registerDto.skills || [],
        keywords: registerDto.keywords || [],
        preferredLanguages: registerDto.preferredLanguages || ['ar', 'en'],
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        country: true,
        city: true,
        university: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      user,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        role: true,
        major: true,
        university: true,
        country: true,
        city: true,
        academicPosition: true,
        highestDegree: true,
        fieldsOfStudy: true,
        skills: true,
        keywords: true,
        preferredLanguages: true,
        phone: true,
        website: true,
        linkedin: true,
        orcid: true,
        googleScholar: true,
        researchGate: true,
        github: true,
        customLinks: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return user;
  }

  async getProfile(userId: string) {
    return this.validateUser(userId);
  }

  async updateProfile(userId: string, updateData: any) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        role: true,
        major: true,
        university: true,
        country: true,
        city: true,
        academicPosition: true,
        highestDegree: true,
        fieldsOfStudy: true,
        skills: true,
        keywords: true,
        preferredLanguages: true,
        phone: true,
        website: true,
        linkedin: true,
        orcid: true,
        googleScholar: true,
        researchGate: true,
        github: true,
        customLinks: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return user;
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        coverUrl: true,
        bio: true,
        role: true,
        major: true,
        university: true,
        country: true,
        city: true,
        academicPosition: true,
        highestDegree: true,
        fieldsOfStudy: true,
        skills: true,
        keywords: true,
        phone: true,
        website: true,
        linkedin: true,
        orcid: true,
        googleScholar: true,
        researchGate: true,
        github: true,
        customLinks: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Find user with password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password updated successfully' };
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return false;
    }
    return bcrypt.compare(password, user.password);
  }

  async searchUsers(query: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.trim().toLowerCase();

    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: searchTerm, mode: 'insensitive' } },
          { fullName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { university: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        avatarUrl: true,
        university: true,
        academicPosition: true,
        bio: true,
      },
      take: 20,
    });

    return users;
  }

  async promoteToAdmin(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        role: true,
      },
    });

    return {
      success: true,
      message: `User ${user.fullName || user.username} has been promoted to admin`,
      user,
    };
  }
}
