import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage, SUPPORTED_LANGUAGES } from "@/stores/languageStore";
import { Globe } from "lucide-react";
import { useEffect } from "react";

export const LanguageSelector = () => {
  const { currentLanguage, setLanguage, detectAndSetLanguage } = useLanguage();

  useEffect(() => {
    // Detect browser language on component mount
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
      <SelectTrigger className="w-[140px]">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue placeholder="Select language">
            <span className="flex items-center gap-1">
              {currentLanguage.flag} {currentLanguage.code.toUpperCase()}
            </span>
          </SelectValue>
        </div>
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