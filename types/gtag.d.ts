// TypeScript definitions for Google Analytics gtag with Consent Mode v2

type ConsentState = 'granted' | 'denied';

interface ConsentParams {
  ad_storage?: ConsentState;
  ad_user_data?: ConsentState;
  ad_personalization?: ConsentState;
  analytics_storage?: ConsentState;
  functionality_storage?: ConsentState;
  personalization_storage?: ConsentState;
  security_storage?: ConsentState;
  wait_for_update?: number;
}

interface GtagConfigParams {
  page_path?: string;
  page_title?: string;
  page_location?: string;
  send_page_view?: boolean;
  [key: string]: unknown;
}

interface GtagEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: unknown;
}

interface Window {
  gtag?: {
    (command: 'js', date: Date): void;
    (command: 'config', targetId: string, config?: GtagConfigParams): void;
    (command: 'event', eventName: string, eventParams?: GtagEventParams): void;
    (command: 'set', params: Record<string, unknown>): void;
    (command: 'consent', consentArg: 'default' | 'update', params: ConsentParams): void;
  };
  dataLayer?: unknown[];
}
