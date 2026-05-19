import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'EnergiaNostra',
  tagline: 'The open-source platform for Italian Renewable Energy Communities (CER)',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://energianostra.it',
  baseUrl: '/',

  organizationName: 'ForliLabs',
  projectName: 'energia-nostra',

  onBrokenLinks: 'warn',

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/ForliLabs/energia-nostra/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    '@docusaurus/theme-mermaid',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexBlog: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig: {
    image: 'img/og-image.svg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'EnergiaNostra',
      logo: {
        alt: 'EnergiaNostra Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Docs',
        },
        {to: '/docs/getting-started/installation', label: 'Quick Start', position: 'left'},
        {to: '/docs/reference/api', label: 'API', position: 'left'},
        {to: '/docs/about/comparison', label: 'Why EnergiaNostra', position: 'left'},
        {
          href: 'https://github.com/ForliLabs/energia-nostra',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Getting Started', to: '/docs/getting-started/installation'},
            {label: 'Core Concepts', to: '/docs/concepts/cer'},
            {label: 'API Reference', to: '/docs/reference/api'},
          ],
        },
        {
          title: 'Community',
          items: [
            {label: 'GitHub Discussions', href: 'https://github.com/ForliLabs/energia-nostra/discussions'},
            {label: 'Issues', href: 'https://github.com/ForliLabs/energia-nostra/issues'},
            {label: 'Contributing', to: '/docs/community/contributing'},
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'Changelog', to: '/docs/community/changelog'},
            {label: 'GitHub', href: 'https://github.com/ForliLabs/energia-nostra'},
            {label: 'License (MIT)', href: 'https://github.com/ForliLabs/energia-nostra/blob/main/LICENSE'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} EnergiaNostra · Built with ❤️ in Forlì for Italian renewable energy communities.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'typescript', 'yaml', 'sql'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
