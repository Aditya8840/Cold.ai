import { Strategy as OutlookStrategy } from 'passport-outlook';
import configOutlook from '../config';

const initializeOutlookStrategy = (passport: any) => {
  passport.use(
    new OutlookStrategy(
      {
        clientID: configOutlook.outlook.clientId,
        clientSecret: configOutlook.outlook.clientSecret,
        callbackURL: configOutlook.outlook.redirectUri,
        scope: [
          'openid',
          'profile',
          'offline_access',
          'Mail.Read',
          'Mail.Send',
          'User.Read'
        ],
        responseType: 'code',
        passReqToCallback: true,
      },
      async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
        try {
          const user = {
            accessToken,
            refreshToken,
            profile,
          };
          done(null, user);
        } catch (error) {
          console.error('Error during Outlook OAuth validation:', error);
          done(error, null);
        }
      }
    )
  );
};

export default initializeOutlookStrategy;
