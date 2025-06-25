import { Router } from 'express';

const router = Router();

// GET /api/privacy/policy - Get current privacy policy
router.get('/policy', (req, res) => {
  const privacyPolicy = {
    version: '1.0',
    effectiveDate: '2025-06-25',
    lastUpdated: '2025-06-25',
    content: {
      title: 'Privacy Policy - Personal Status Tracker',
      sections: [
        {
          title: 'Information We Collect',
          content: [
            'Account information: Username, password (encrypted), and role',
            'Status data: Water intake timestamps and mood/altitude ratings',
            'Technical data: IP addresses, browser information, and access logs',
            'Usage data: API requests, login/logout times, and system interactions'
          ]
        },
        {
          title: 'How We Use Your Information',
          content: [
            'Provide and maintain the personal status tracking service',
            'Authenticate users and maintain account security',
            'Monitor system performance and detect security threats',
            'Comply with legal obligations and protect user safety'
          ]
        },
        {
          title: 'Data Storage and Security',
          content: [
            'Data is stored locally on our servers with encryption at rest',
            'Access logs are encrypted and automatically deleted after 30 days',
            'Passwords are hashed using industry-standard bcrypt encryption',
            'We implement security measures to protect against unauthorized access'
          ]
        },
        {
          title: 'Data Retention',
          content: [
            'Account data: Retained until account deletion',
            'Status tracking data: Retained until manually deleted by user',
            'Access logs and IP addresses: Automatically deleted after 30 days',
            'Error logs: Retained for 30 days for system maintenance'
          ]
        },
        {
          title: 'Your Rights',
          content: [
            'Access your personal data stored in the system',
            'Delete your account and associated data at any time',
            'Modify your status tracking data',
            'Request information about data processing activities'
          ]
        },
        {
          title: 'Legal Basis for Processing',
          content: [
            'Account management: Contractual necessity',
            'Security monitoring: Legitimate interest in system security',
            'Access logging: Legitimate interest in service provision and security',
            'Status tracking: User consent through service usage'
          ]
        },
        {
          title: 'Data Sharing',
          content: [
            'We do not sell, trade, or share your personal data with third parties',
            'Data may be disclosed if required by law or to protect system security',
            'Anonymous usage statistics may be generated for system improvement'
          ]
        },
        {
          title: 'Contact Information',
          content: [
            'For privacy-related questions or to exercise your rights, contact the system administrator',
            'You have the right to lodge a complaint with relevant data protection authorities'
          ]
        }
      ]
    }
  };

  res.json({
    success: true,
    data: privacyPolicy
  });
});

export default router;