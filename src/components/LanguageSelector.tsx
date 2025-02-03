import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage, SUPPORTED_LANGUAGES } from "@/stores/languageStore";
import { useEffect } from "react";
import { toast } from "sonner";

export const LanguageSelector = () => {
  const { currentLanguage, setLanguage, detectAndSetLanguage } = useLanguage();

  useEffect(() => {
    detectAndSetLanguage();
  }, [detectAndSetLanguage]);

  const handleLanguageChange = (value: string) => {
    const language = SUPPORTED_LANGUAGES.find((lang) => lang.code === value);
    if (language) {
      setLanguage(language);
      toast.success(`Language changed to ${language.name}`);
      console.log("Language changed:", language);
    }
  };

  return (
    <Select
      value={currentLanguage.code}
      onValueChange={handleLanguageChange}
    >
      <SelectTrigger className="w-[120px] h-9">
        <SelectValue placeholder="Select language">
          <span className="flex items-center gap-1.5">
            <span>{currentLanguage.flag}</span>
            <span>{currentLanguage.code.toUpperCase()}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <div className="flex items-center gap-3">
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