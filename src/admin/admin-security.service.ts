import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

const OPERATIONS_PASSWORD_KEY = 'operations_password';
const DEFAULT_OPERATIONS_PASSWORD = 'Admin@12345';

@Injectable()
export class AdminSecurityService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureSecret() {
    const prisma = this.prisma as any;

    let secret = await prisma.adminSecret.findUnique({
      where: { key: OPERATIONS_PASSWORD_KEY },
    });

    if (!secret) {
      const seedPassword = process.env.ADMIN_OPERATIONS_PASSWORD || DEFAULT_OPERATIONS_PASSWORD;
      const hashed = await bcrypt.hash(seedPassword, 12);
      secret = await prisma.adminSecret.create({
        data: {
          key: OPERATIONS_PASSWORD_KEY,
          value: hashed,
        },
      });
    }

    return secret;
  }

  async validateOperationsPassword(password: string): Promise<boolean> {
    if (!password) {
      return false;
    }

    const secret = await this.ensureSecret();
    return bcrypt.compare(password, secret.value);
  }

  async updateOperationsPassword(currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.trim().length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long');
    }

    const secret = await this.ensureSecret();
    const matches = await bcrypt.compare(currentPassword || '', secret.value);

    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    const prisma = this.prisma as any;
    await prisma.adminSecret.update({
      where: { key: OPERATIONS_PASSWORD_KEY },
      data: { value: hashed },
    });
  }
}
