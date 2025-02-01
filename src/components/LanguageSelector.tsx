import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage, SUPPORTED_LANGUAGES } from "@/stores/languageStore";
import { useEffect } from "react";

export const LanguageSelector = () => {
  const { currentLanguage, setLanguage, detectAndSetLanguage } = useLanguage();

  useEffect(() => {
    detectAndSetLanguage();
  }, [detectAndSetLanguage]);

  return (
    <Select
      value={currentLanguage.code}
      onValueChange={(value) => {
        const language = SUPPORTED_LANGUAGES.find((lang) => lang.code === value);
        if (language) {
          setLanguage(language);
        }
      }}
    >
      <SelectTrigger className="w-[90px] h-9">
        <SelectValue placeholder="Select language">
          <span className="flex items-center gap-2">
            {currentLanguage.flag} {currentLanguage.code.toUpperCase()}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <div className="flex items-center gap-2">
              <span>{language.flag}</span>
              <span>{language.name}</span>
              <span className="text-muted-foreground">({language.nativeName})</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};