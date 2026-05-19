import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    'introduction',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/quickstart',
        'getting-started/your-first-cer',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'concepts/cer',
        'concepts/architecture',
        'concepts/data-model',
        'concepts/energy-sharing',
        'concepts/authentication',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/onboard-members',
        'guides/upload-meter-data',
        'guides/billing-and-incentives',
        'guides/governance-voting',
        'guides/gse-reporting',
        'guides/deploy-production',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/api',
        'reference/configuration',
        'reference/cli-scripts',
      ],
    },
    {
      type: 'category',
      label: 'About',
      items: [
        'about/comparison',
        'about/roadmap',
      ],
    },
    {
      type: 'category',
      label: 'Help',
      items: [
        'troubleshooting',
        'faq',
      ],
    },
    {
      type: 'category',
      label: 'Community',
      items: [
        'community/contributing',
        'community/code-of-conduct',
        'community/changelog',
      ],
    },
  ],
};

export default sidebars;
