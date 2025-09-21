import React from 'react';
import type { OcrLanguage } from '../../types/ocr.types';

interface LanguageSelectorProps {
  language: OcrLanguage;
  setLanguage: (lang: OcrLanguage) => void;
  disabled: boolean;
}

const LANGUAGES: { code: OcrLanguage; name: string }[] = [
  { code: 'eng+fra', name: 'Auto (English + French)' },
  { code: 'eng', name: 'English' },
  { code: 'fra', name: 'French' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ language, setLanguage, disabled }) => {
  return (
    <div>
      <label htmlFor="language" className="block text-sm font-medium text-slate-300">
        Document Language
      </label>
      <select
        id="language"
        value={language}
        onChange={(e) => setLanguage(e.target.value as OcrLanguage)}
        disabled={disabled}
        className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-slate-700 border-slate-600 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md disabled:opacity-50"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;