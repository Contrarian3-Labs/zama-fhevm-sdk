import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "FHEVM SDK Documentation",
  description: "Framework-agnostic SDK for building confidential dApps with FHEVM",

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'author', content: 'Zama' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'FHEVM SDK Documentation' }],
    ['meta', { property: 'og:description', content: 'Framework-agnostic SDK for building confidential dApps with FHEVM' }]
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/.vitepress/assets/fhevm-logo.png',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Getting Started', link: '/getting-started/installation' },
      { text: 'API Reference', link: '/api-reference/core/createFhevmConfig' },
      { text: 'Examples', link: '/examples/' },
      {
        text: 'Links',
        items: [
          { text: 'FHEVM Docs', link: 'https://docs.zama.ai/fhevm' },
          { text: 'Zama', link: 'https://www.zama.ai' },
          { text: 'GitHub', link: 'https://github.com/zama-ai/fhevm-react-template' }
        ]
      }
    ],

    sidebar: {
      '/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Overview', link: '/README' },
            { text: 'Learning Path', link: '/LEARNING_PATH' }
          ]
        },
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Installation', link: '/getting-started/installation' },
            { text: 'Quick Start - React', link: '/getting-started/quick-start-react' },
            { text: 'Quick Start - Vue', link: '/getting-started/quick-start-vue' },
            { text: 'Quick Start - Vanilla JS', link: '/getting-started/quick-start-vanilla' },
            { text: 'Architecture Overview', link: '/getting-started/architecture-overview' }
          ]
        },
        {
          text: 'Core Concepts',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/core-concepts/README' },
            { text: 'Configuration', link: '/core-concepts/configuration' },
            { text: 'FHEVM Instance', link: '/core-concepts/fhevm-instance' },
            { text: 'Encryption', link: '/core-concepts/encryption' },
            { text: 'Decryption', link: '/core-concepts/decryption' },
            { text: 'Storage', link: '/core-concepts/storage' }
          ]
        },
        {
          text: 'API Reference',
          collapsed: false,
          items: [
            {
              text: 'Core',
              collapsed: true,
              items: [
                { text: 'Overview', link: '/api-reference/core/README' },
                { text: 'createFhevmConfig()', link: '/api-reference/core/createFhevmConfig' },
                { text: 'createStorage()', link: '/api-reference/core/createStorage' },
                { text: 'hydrate()', link: '/api-reference/core/hydrate' },
                { text: 'Types', link: '/api-reference/core/types' }
              ]
            },
            {
              text: 'Actions',
              collapsed: true,
              items: [
                { text: 'Overview', link: '/api-reference/actions/README' },
                { text: 'createInstance()', link: '/api-reference/actions/createInstance' },
                { text: 'encrypt()', link: '/api-reference/actions/encrypt' },
                { text: 'encryptWith()', link: '/api-reference/actions/encryptWith' },
                { text: 'decrypt()', link: '/api-reference/actions/decrypt' },
                { text: 'getDecryptionSignature()', link: '/api-reference/actions/getDecryptionSignature' },
                { text: 'publicDecrypt()', link: '/api-reference/actions/publicDecrypt' },
                { text: 'Helper Functions', link: '/api-reference/actions/helpers' }
              ]
            },
            {
              text: 'React',
              collapsed: true,
              items: [
                { text: 'Overview', link: '/api-reference/react/README' },
                { text: 'FhevmProvider', link: '/api-reference/react/FhevmProvider' },
                { text: 'useFhevmInstance()', link: '/api-reference/react/useFhevmInstance' },
                { text: 'useEncrypt()', link: '/api-reference/react/useEncrypt' },
                { text: 'useDecrypt()', link: '/api-reference/react/useDecrypt' },
                { text: 'usePublicDecrypt()', link: '/api-reference/react/usePublicDecrypt' },
                { text: 'useFhevm()', link: '/api-reference/react/useFhevm' }
              ]
            },
            {
              text: 'Vue',
              collapsed: true,
              items: [
                { text: 'Overview', link: '/api-reference/vue/README' },
                { text: 'createFhevmPlugin()', link: '/api-reference/vue/createFhevmPlugin' },
                { text: 'useFhevmInstance()', link: '/api-reference/vue/useFhevmInstance' },
                { text: 'useEncrypt()', link: '/api-reference/vue/useEncrypt' },
                { text: 'useDecrypt()', link: '/api-reference/vue/useDecrypt' }
              ]
            }
          ]
        },
        {
          text: 'Examples',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/examples/README' },
            { text: 'Encrypted Counter', link: '/examples/encrypted-counter' }
          ]
        },
        {
          text: 'Guides',
          collapsed: false,
          items: [
            { text: 'Testing', link: '/guides/testing' },
            { text: 'Security Best Practices', link: '/guides/security-best-practices' },
            { text: 'Debugging', link: '/guides/debugging' },
            { text: 'Deployment', link: '/guides/deployment' }
          ]
        },
        {
          text: 'Troubleshooting',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/troubleshooting/README' },
            { text: 'Common Errors', link: '/troubleshooting/common-errors' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/zama-ai/fhevm-react-template' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Built with ❤️ by <a href="https://www.zama.ai">Zama</a>',
      copyright: 'Copyright © 2024 Zama'
    },

    editLink: {
      pattern: 'https://github.com/zama-ai/fhevm-react-template/edit/main/packages/fhevm-sdk/docs/:path',
      text: 'Edit this page on GitHub'
    },

    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    }
  },

  markdown: {
    lineNumbers: true,
    container: {
      tipLabel: '💡 TIP',
      warningLabel: '⚠️ WARNING',
      dangerLabel: '💥 DANGER',
      infoLabel: '✅ INFO'
    }
  }
})
