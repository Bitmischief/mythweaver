import MailchimpClient, { MergeVar } from "@mailchimp/mailchimp_transactional";

const mailchimpClient = MailchimpClient(
  process.env.MAILCHIMP_TRANSACTIONAL_API_KEY as string
);

export const sendTransactionalEmail = async (
  template: string,
  subject: string,
  to: string,
  variables: MergeVar[]
) => {
  await mailchimpClient.messages.sendTemplate({
    template_name: template,
    template_content: [],
    message: {
      subject: subject,
      from_email: "noreply@mythweaver.co",
      from_name: "MythWeaver",
      to: [
        {
          email: to,
        },
      ],
      global_merge_vars: variables,
    },
  });
};
