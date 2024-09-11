import mailchimpClient from '../lib/mailchimpMarketing';
import { lists, Status } from '@mailchimp/mailchimp_marketing';
import { format } from 'date-fns';
import logger from '../lib/logger';
import EmailType = lists.EmailType;

export const addEmailToMailingList = async (
  email: string,
  ip: string | undefined = undefined,
) => {
  const response = (await mailchimpClient.lists.batchListMembers(
    process.env.MAILCHIMP_AUDIENCE_ID as string,
    {
      members: [
        {
          email_address: email.toLowerCase(),
          email_type: 'html' as EmailType,
          status: 'subscribed' as Status,
          ip_opt: ip,
          ip_signup: ip,
          timestamp_signup: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          timestamp_opt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        },
      ],
    },
  )) as any;

  if (response?.errors?.length > 0) {
    logger.warn('Received errors from Mailchimp', response.errors);
  }
};
