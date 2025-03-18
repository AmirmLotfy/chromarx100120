
import { chromeStorage } from "@/services/chromeStorageService";

type LocaleKey = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

interface LocalizedMessages {
  subscription: {
    status: {
      active: string;
      expired: string;
      canceled: string;
      grace_period: string;
    };
    billing: {
      auto_renew_on: string;
      auto_renew_off: string;
      cancel_confirmation: string;
      payment_method_updated: string;
      renewal_failed: string;
      renewal_success: string;
      upgrade_success: string;
      downgrade_success: string;
      prorate_message: string;
    };
    currencies: {
      usd: string;
      eur: string;
      gbp: string;
      jpy: string;
      cad: string;
    };
  };
}

// Translations
const messages: Record<LocaleKey, LocalizedMessages> = {
  en: {
    subscription: {
      status: {
        active: 'Active',
        expired: 'Expired',
        canceled: 'Canceled',
        grace_period: 'Payment Required'
      },
      billing: {
        auto_renew_on: 'Auto-renewal turned on',
        auto_renew_off: 'Auto-renewal turned off. Your subscription will end on the expiration date.',
        cancel_confirmation: 'Are you sure you want to cancel your subscription?',
        payment_method_updated: 'Payment method updated successfully',
        renewal_failed: "We couldn't process your subscription renewal",
        renewal_success: 'Your subscription has been renewed successfully',
        upgrade_success: 'Your subscription has been upgraded successfully',
        downgrade_success: 'Your subscription has been downgraded successfully',
        prorate_message: 'You will be {action} {amount} {currency} for the remaining {days} days of your billing cycle.'
      },
      currencies: {
        usd: 'USD',
        eur: 'EUR',
        gbp: 'GBP',
        jpy: 'JPY',
        cad: 'CAD'
      }
    }
  },
  es: {
    subscription: {
      status: {
        active: 'Activa',
        expired: 'Expirada',
        canceled: 'Cancelada',
        grace_period: 'Pago requerido'
      },
      billing: {
        auto_renew_on: 'Renovación automática activada',
        auto_renew_off: 'Renovación automática desactivada. Tu suscripción terminará en la fecha de expiración.',
        cancel_confirmation: '¿Estás seguro de que quieres cancelar tu suscripción?',
        payment_method_updated: 'Método de pago actualizado correctamente',
        renewal_failed: "No pudimos procesar la renovación de tu suscripción",
        renewal_success: 'Tu suscripción ha sido renovada correctamente',
        upgrade_success: 'Tu suscripción ha sido actualizada correctamente',
        downgrade_success: 'Tu suscripción ha sido degradada correctamente',
        prorate_message: 'Se te {action} {amount} {currency} por los {days} días restantes de tu ciclo de facturación.'
      },
      currencies: {
        usd: 'USD',
        eur: 'EUR',
        gbp: 'GBP',
        jpy: 'JPY',
        cad: 'CAD'
      }
    }
  },
  fr: {
    subscription: {
      status: {
        active: 'Active',
        expired: 'Expirée',
        canceled: 'Annulée',
        grace_period: 'Paiement requis'
      },
      billing: {
        auto_renew_on: 'Renouvellement automatique activé',
        auto_renew_off: 'Renouvellement automatique désactivé. Votre abonnement se terminera à la date d\'expiration.',
        cancel_confirmation: 'Êtes-vous sûr de vouloir annuler votre abonnement?',
        payment_method_updated: 'Méthode de paiement mise à jour avec succès',
        renewal_failed: "Nous n'avons pas pu traiter le renouvellement de votre abonnement",
        renewal_success: 'Votre abonnement a été renouvelé avec succès',
        upgrade_success: 'Votre abonnement a été mis à niveau avec succès',
        downgrade_success: 'Votre abonnement a été rétrogradé avec succès',
        prorate_message: 'Vous serez {action} de {amount} {currency} pour les {days} jours restants de votre cycle de facturation.'
      },
      currencies: {
        usd: 'USD',
        eur: 'EUR',
        gbp: 'GBP',
        jpy: 'JPY',
        cad: 'CAD'
      }
    }
  },
  de: {
    subscription: {
      status: {
        active: 'Aktiv',
        expired: 'Abgelaufen',
        canceled: 'Gekündigt',
        grace_period: 'Zahlung erforderlich'
      },
      billing: {
        auto_renew_on: 'Automatische Verlängerung aktiviert',
        auto_renew_off: 'Automatische Verlängerung deaktiviert. Ihr Abonnement endet am Ablaufdatum.',
        cancel_confirmation: 'Sind Sie sicher, dass Sie Ihr Abonnement kündigen möchten?',
        payment_method_updated: 'Zahlungsmethode erfolgreich aktualisiert',
        renewal_failed: "Wir konnten die Verlängerung Ihres Abonnements nicht verarbeiten",
        renewal_success: 'Ihr Abonnement wurde erfolgreich verlängert',
        upgrade_success: 'Ihr Abonnement wurde erfolgreich aktualisiert',
        downgrade_success: 'Ihr Abonnement wurde erfolgreich herabgestuft',
        prorate_message: 'Ihnen werden {amount} {currency} für die verbleibenden {days} Tage Ihres Abrechnungszeitraums {action}.'
      },
      currencies: {
        usd: 'USD',
        eur: 'EUR',
        gbp: 'GBP',
        jpy: 'JPY',
        cad: 'CAD'
      }
    }
  },
  ja: {
    subscription: {
      status: {
        active: 'アクティブ',
        expired: '期限切れ',
        canceled: 'キャンセル済み',
        grace_period: '支払いが必要です'
      },
      billing: {
        auto_renew_on: '自動更新がオンになりました',
        auto_renew_off: '自動更新がオフになりました。サブスクリプションは有効期限日に終了します。',
        cancel_confirmation: 'サブスクリプションをキャンセルしてもよろしいですか？',
        payment_method_updated: '支払い方法が正常に更新されました',
        renewal_failed: "サブスクリプションの更新を処理できませんでした",
        renewal_success: 'サブスクリプションが正常に更新されました',
        upgrade_success: 'サブスクリプションが正常にアップグレードされました',
        downgrade_success: 'サブスクリプションが正常にダウングレードされました',
        prorate_message: '請求サイクルの残り{days}日間、{amount} {currency}が{action}されます。'
      },
      currencies: {
        usd: 'USD',
        eur: 'EUR',
        gbp: 'GBP',
        jpy: 'JPY',
        cad: 'CAD'
      }
    }
  },
  zh: {
    subscription: {
      status: {
        active: '激活',
        expired: '已过期',
        canceled: '已取消',
        grace_period: '需要付款'
      },
      billing: {
        auto_renew_on: '自动续订已开启',
        auto_renew_off: '自动续订已关闭。您的订阅将在到期日结束。',
        cancel_confirmation: '您确定要取消订阅吗？',
        payment_method_updated: '支付方式更新成功',
        renewal_failed: "我们无法处理您的订阅续订",
        renewal_success: '您的订阅已成功续订',
        upgrade_success: '您的订阅已成功升级',
        downgrade_success: '您的订阅已成功降级',
        prorate_message: '您将{action} {amount} {currency}，用于账单周期的剩余 {days} 天。'
      },
      currencies: {
        usd: 'USD',
        eur: 'EUR',
        gbp: 'GBP',
        jpy: 'JPY',
        cad: 'CAD'
      }
    }
  }
};

// Current locale (default to 'en')
let currentLocale: LocaleKey = 'en';

/**
 * Initialize i18n by loading the locale from storage
 */
export const initI18n = async (): Promise<void> => {
  try {
    const storedLocale = await chromeStorage.get<LocaleKey>('locale');
    if (storedLocale && messages[storedLocale]) {
      currentLocale = storedLocale;
    } else {
      // Try to get locale from browser
      const browserLang = navigator.language.split('-')[0] as LocaleKey;
      if (messages[browserLang]) {
        currentLocale = browserLang;
        await chromeStorage.set('locale', currentLocale);
      }
    }
  } catch (error) {
    console.error('Error initializing i18n:', error);
  }
};

/**
 * Set the current locale
 */
export const setLocale = async (locale: LocaleKey): Promise<void> => {
  if (messages[locale]) {
    currentLocale = locale;
    await chromeStorage.set('locale', locale);
  } else {
    console.error(`Locale ${locale} not supported`);
  }
};

/**
 * Get a localized message
 */
export const t = (key: string, replacements?: Record<string, string | number>): string => {
  try {
    // Split the key by dots to traverse the messages object
    const parts = key.split('.');
    let message: any = messages[currentLocale];
    
    for (const part of parts) {
      if (message[part] === undefined) {
        // Fallback to English if the key doesn't exist in the current locale
        message = messages.en;
        for (const fallbackPart of parts) {
          message = message[fallbackPart];
        }
        break;
      }
      message = message[part];
    }
    
    // If message is not a string at this point, return the key
    if (typeof message !== 'string') {
      return key;
    }
    
    // Replace placeholders if replacements provided
    if (replacements) {
      return Object.entries(replacements).reduce((msg, [placeholder, value]) => {
        return msg.replace(new RegExp(`{${placeholder}}`, 'g'), String(value));
      }, message);
    }
    
    return message;
  } catch (error) {
    console.error(`Error getting translation for key: ${key}`, error);
    return key;
  }
};

/**
 * Format currency based on locale and currency code
 */
export const formatCurrency = (
  amount: number, 
  currencyCode: string = 'USD'
): string => {
  try {
    // Map locale keys to Intl.NumberFormat locales
    const localeMap: Record<LocaleKey, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      ja: 'ja-JP',
      zh: 'zh-CN'
    };
    
    const formatter = new Intl.NumberFormat(localeMap[currentLocale], {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};

// Initialize i18n when the module is imported
initI18n();
