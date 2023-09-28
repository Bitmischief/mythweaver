import { prisma } from '../../lib/providers/prisma';
import { parentLogger } from '../../lib/logger';
import mailchimpClient from '../../lib/mailchimpMarketing';
import md5 from 'md5';

const logger = parentLogger.getSubLogger();

export const tagUsersAsEarlyAccess = async () => {
  logger.info('Tagging users as early access');
  const take = 100;
  let skip = 0;
  let moreUsers = true;

  while (moreUsers) {
    logger.info(`Grabbing batch ${skip}-${skip + take} of users to tag`);

    const users = await prisma.user.findMany({
      skip,
      take,
    });

    for (const user of users) {
      logger.info('Tagging user', user.id, user.email);

      const subscriberHash = md5(user.email.toLowerCase());

      const response = await mailchimpClient.lists.updateListMemberTags(
        process.env.MAILCHIMP_AUDIENCE_ID as string,
        subscriberHash,
        {
          tags: [
            [
              {
                name: 'Early Access',
                status: 'active',
              },
            ],
          ],
        },
      );

      console.log(
        `The return type for this endpoint is null, so this should be true: ${
          response === null
        }`,
      );

      logger.info('Successfully tagged user as early access');
    }

    moreUsers = users.length > 0;
    skip += take;
  }
};
