import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage, SUPPORTED_LANGUAGES } from "@/stores/languageStore";
import { Globe } from "lucide-react";

export const LanguageSelector = () => {
  const { currentLanguage, setLanguage } = useLanguage();

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
          <SelectValue placeholder="Select language" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            {language.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};