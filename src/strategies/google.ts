import { Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth20';
import config from '../config';

const initializeGoogleStrategy = (passport: any) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId!,
        clientSecret: config.google.clientSecret!,
        callbackURL: config.google.redirectUri,
        scope: [
          'email',
          'profile',
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify'
        ],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) => {
        try {
          const user = {
            accessToken,
            refreshToken,
            profile,
          };
          done(null, user);
        } catch (error) {
          done(error, undefined);
        }
      }
    )
  );
};

export default initializeGoogleStrategy;