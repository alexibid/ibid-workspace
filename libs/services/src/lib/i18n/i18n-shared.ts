import { AppTranslatePipe } from './app-translate.pipe';
import { AppDatePipe } from './app-date.pipe';
import { AppCurrencyPipe } from './app-currency.pipe';
import { I18nService, translate } from './i18n.service';

export const I18N_SHARED = [AppTranslatePipe, AppDatePipe, AppCurrencyPipe] as const;

export { AppTranslatePipe, AppDatePipe, AppCurrencyPipe, I18nService, translate };
