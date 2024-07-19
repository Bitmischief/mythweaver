import mixpanel from 'mixpanel-browser';
import { patchCurrentUser } from '@/api/users.ts';

function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

export const reportInitialTrackingData = async (source: string, influencer: string | undefined) => {
  // Read and parse the marketing_info cookie
  const marketingInfoCookie = getCookie('marketing_info');
  if (marketingInfoCookie) {
    try {
      const marketingInfo = JSON.parse(marketingInfoCookie);

      mixpanel.register({
        $referrer: marketingInfo.referrer,
        $referring_domain: marketingInfo.referrer,
        initial_referrer: marketingInfo.referrer,
        initial_referring_domain: marketingInfo.referrer,
        utm_source: marketingInfo.params?.utm_source,
        utm_medium: marketingInfo.params?.utm_medium,
        utm_campaign: marketingInfo.params?.utm_campaign,
        utm_term: marketingInfo.params?.utm_term,
        utm_content: marketingInfo.params?.utm_content,
      });
    } catch (error) {
      console.error('Error parsing marketing_info cookie:', error);
    }
  }

  mixpanel.register({
    declared_signup_source: source,
    declared_influencer: influencer,
  });

  // Now capture all Mixpanel properties after setting new values
  const mixpanelData: any = {};

  const properties = [
    'initial_referrer',
    'initial_referring_domain',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    '$os',
    '$browser',
    '$browser_version',
    '$device',
    '$current_url',
    '$referrer',
    '$referring_domain',
    '$screen_height',
    '$screen_width',
    '$viewport_height',
    '$viewport_width',
    'declared_signup_source',
    'declared_influencer',
  ];
 
  properties.forEach((prop) => {
    mixpanelData[prop] = mixpanel.get_property(prop);
  });

  console.log('Mixpanel Data:', mixpanelData);

  await patchCurrentUser({
    initialTrackingData: mixpanelData,
    onboarded: true,
  });
};
