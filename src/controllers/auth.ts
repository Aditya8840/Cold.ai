import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import EmailService from "../services/email";
import OpenaiService from "../services/openai";
import userStore from "../utils/userStore";
import { v4 as uuidv4 } from "uuid";

const openaiService = new OpenaiService();

export const googleAuthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as any;
    console.log("Google Auth Callback User:", user);

    const userId = uuidv4();
    const userDetails = {
      id: userId,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      profile: user.profile,
    };

    userStore.addUser(userDetails);
    logger.info(`User ${userId} added to UserStore.`);
    new EmailService(userDetails, openaiService);

    res.redirect("/");
  } catch (error) {
    logger.error("Error in Google Auth Callback:", error);
    next(error);
  }
};

export const outlookAuthCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as any;
    console.log("Outlook Auth Callback User:", user);
    const userId = uuidv4();

    const userDetails = {
      id: userId,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      profile: user.profile,
    };

    userStore.addUser(userDetails);
    logger.info(`User ${userId} added to UserStore.`);
    new EmailService(userDetails, openaiService);

    res.redirect("/");
  } catch (error) {
    logger.error("Error in Outlook Auth Callback:", error);
    next(error);
  }
};
