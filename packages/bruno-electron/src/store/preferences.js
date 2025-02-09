const Yup = require('yup');
const Store = require('electron-store');
const { get } = require('lodash');

/**
 * The preferences are stored in the electron store 'preferences.json'.
 * The electron process uses this module to get the preferences.
 *
 */

const defaultPreferences = {
  request: {
    sslVerification: true,
    timeout: 0
  },
  font: {
    codeFont: 'default'
  },
  proxy: {
    enabled: false,
    protocol: 'http',
    hostnameHttp: '',
    portHttp: '',
    auth: {
      enabled: false,
      username: '',
      password: ''
    },
    noProxy: ''
  }
};

const preferencesSchema = Yup.object().shape({
  request: Yup.object().shape({
    sslVerification: Yup.boolean(),
    timeout: Yup.number()
  }),
  font: Yup.object().shape({
    codeFont: Yup.string().nullable()
  }),
  proxy: Yup.object({
    enabled: Yup.boolean(),
    protocol: Yup.string().oneOf(['http', 'https', 'socks4', 'socks5']),
    hostname: Yup.string().max(1024),
    port: Yup.number().min(1).max(65535),
    auth: Yup.object({
      enabled: Yup.boolean(),
      username: Yup.string().max(1024),
      password: Yup.string().max(1024)
    }).optional(),
    noProxy: Yup.string().optional().max(1024)
  })
});

class PreferencesStore {
  constructor() {
    this.store = new Store({
      name: 'preferences',
      clearInvalidConfig: true
    });
  }

  getPath() {
    return this.store.path;
  }

  getPreferences() {
    return {
      ...defaultPreferences,
      ...this.store.get('preferences')
    };
  }

  savePreferences(newPreferences) {
    return this.store.set('preferences', newPreferences);
  }
}

const preferencesStore = new PreferencesStore();

const getPreferences = () => {
  return preferencesStore.getPreferences();
};

const savePreferences = async (newPreferences) => {
  return new Promise((resolve, reject) => {
    preferencesSchema
      .validate(newPreferences, { abortEarly: true })
      .then((validatedPreferences) => {
        preferencesStore.savePreferences(validatedPreferences);
        resolve();
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const getPath = () => {
  return preferencesStore.getPath();
};

const preferences = {
  isTlsVerification: () => {
    return get(getPreferences(), 'request.sslVerification', true);
  },

  getTimeout: () => {
    return get(getPreferences(), 'request.timeout', 0);
  },

  getProxyConfig: () => {
    return get(getPreferences(), 'proxy', {});
  }
};

module.exports = {
  getPreferences,
  savePreferences,
  getPath,
  preferences
};
