import * as TwilioClient from 'twilio';

let twilioClient: ReturnType<typeof TwilioClient.default> | null = null;

export const initializeTwilio = () => {
  if (twilioClient) {
    return twilioClient;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken) {
    console.warn(
      '⚠️  TWILIO_ACCOUNT_SID ou TWILIO_AUTH_TOKEN non définis. Twilio SMS ne sera pas disponible.',
    );
    return null;
  }

  try {
    twilioClient = TwilioClient.default(accountSid, authToken);
    return twilioClient;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de Twilio:', error);
    return null;
  }
};

export const getTwilioClient = () => {
  return twilioClient || initializeTwilio();
};

export const getTwilioFromNumber = () => {
  return process.env.TWILIO_PHONE_NUMBER || '';
};
