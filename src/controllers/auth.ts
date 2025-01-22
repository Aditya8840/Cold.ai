import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const googleAuthCallback = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user;
    console.log('Google Auth Callback User:'+user?.toString());

    res.redirect('/');
  } catch (error) {
    logger.error('Error in Google Auth Callback:', error);
    next(error);
  }
};

export const outlookAuthCallback = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const user = req.user;
    console.log('Google Auth Callback User:'+user?.toString());

    res.redirect('/');
  } catch (error) {
    logger.error('Error in Outlook Auth Callback:', error);
    next(error);
  }
};