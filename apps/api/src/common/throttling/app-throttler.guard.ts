import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { authenticatedOrIpTracker } from './rate-limit-trackers';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: Record<string, unknown>): Promise<string> {
    return Promise.resolve(authenticatedOrIpTracker(request));
  }
}
