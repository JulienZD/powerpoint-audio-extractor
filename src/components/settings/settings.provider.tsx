import {
  createContext,
  type FC,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

export type AppSettings = {
  playbackSpeeds: readonly number[];
};

export const SettingsContext = createContext<{
  settings: AppSettings;
  resetSetting: (setting: keyof AppSettings) => void;
  setSettings: (settings: AppSettings) => void;
} | null>(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }

  return context;
};

const DEFAULT_SETTINGS: AppSettings = {
  playbackSpeeds: [1, 1.25, 1.5, 1.75, 2, 2.5],
};

const LOCAL_STORAGE_KEY = 'mediaViewerSettings';

export const SettingsProvider: FC<PropsWithChildren> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const updateSettings = useCallback(
    (newSettings: AppSettings) => {
      setSettings(newSettings);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));
    },
    [setSettings],
  );

  useEffect(() => {
    const savedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (!savedSettings) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    }

    const settings: AppSettings = savedSettings
      ? JSON.parse(savedSettings)
      : DEFAULT_SETTINGS;

    setSettings(settings);
  }, []);

  const resetSetting = useCallback(
    (setting: keyof AppSettings) => {
      if (!settings) return;

      const newSettings = {
        ...settings,
        [setting]: DEFAULT_SETTINGS[setting],
      };

      updateSettings(newSettings);
    },
    [settings, updateSettings],
  );

  if (!settings) {
    return null;
  }

  return (
    <SettingsContext.Provider
      value={{ settings, resetSetting, setSettings: updateSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
