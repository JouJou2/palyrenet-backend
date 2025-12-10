import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to not throw an error when user is not authenticated
  handleRequest(err: any, user: any) {
    // Return the user if exists, otherwise return null (don't throw)
    return user || null;
  }

  // Always return true so the request continues even without auth
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const result = super.canActivate(context);
    
    if (result instanceof Promise) {
      return result.catch(() => true);
    }
    
    return true;
  }
}
