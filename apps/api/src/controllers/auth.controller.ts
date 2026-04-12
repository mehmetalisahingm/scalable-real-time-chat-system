import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { authService } from '@/services/auth.service';
import { clearRefreshCookie } from '@/utils/cookie';

export const authController = {
  async register(request: Request, response: Response) {
    const result = await authService.register(request.body);
    response.cookie('refreshToken', result.refreshToken, result.cookieOptions);

    return response.status(StatusCodes.CREATED).json({
      data: result.response,
    });
  },

  async login(request: Request, response: Response) {
    const result = await authService.login(request.body);
    response.cookie('refreshToken', result.refreshToken, result.cookieOptions);

    return response.status(StatusCodes.OK).json({
      data: result.response,
    });
  },

  async refresh(request: Request, response: Response) {
    const result = await authService.refresh(request.cookies.refreshToken ?? request.body.refreshToken);
    response.cookie('refreshToken', result.refreshToken, result.cookieOptions);

    return response.status(StatusCodes.OK).json({
      data: result.response,
    });
  },

  async logout(request: Request, response: Response) {
    const result = await authService.logout(request.cookies.refreshToken);
    clearRefreshCookie(response, result.cookieOptions);

    return response.status(StatusCodes.OK).json({
      data: {
        success: true,
      },
    });
  },
};
