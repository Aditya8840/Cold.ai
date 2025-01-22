import { OIDCStrategy, VerifyCallback } from 'passport-azure-ad';
import config from '../config';

const initializeOutlookStrategy = (passport: any) => {
  passport.use(
    new OIDCStrategy(
      {
        identityMetadata: `https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration`,
        clientID: config.outlook.clientId!,
        clientSecret: config.outlook.clientSecret,
        allowHttpForRedirectUrl: true,
        redirectUrl: config.outlook.redirectUri,
        responseType: 'code',
        responseMode: 'query',
        scope: [
            'openid',
            'profile',
            'offline_access',
            'https://outlook.office.com/Mail.Read',
            'https://outlook.office.com/Mail.Send',
            'User.Read'
        ],
        passReqToCallback: true,
      },
      async (
        req: any,
        iss: string,
        sub: string,
        profile: any,
        accessToken: string,
        refreshToken: string,
        done: VerifyCallback
      ) => {
        try {
          if (!profile) {
            return done(new Error('No profile found')); 
          }

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
