import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { userService } from '@/services/user.service';

export const userController = {
  async me(request: Request, response: Response) {
    const user = await userService.getCurrentUser(request.user.id);

    return response.status(StatusCodes.OK).json({
      data: user,
    });
  },

  async search(request: Request, response: Response) {
    const query = typeof request.query.query === 'string' ? request.query.query : '';
    const users = await userService.searchUsers(request.user.id, query);

    return response.status(StatusCodes.OK).json({
      data: users,
    });
  },
};
