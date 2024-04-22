import React, { useContext } from 'react';

export interface TranslateFunction {
  (translationKey: string, data?: { [key: string]: string }): string;
}

export type MessageOrNode = string | MessageTree;
export type MessageTree = { [key: string]: MessageOrNode };

export interface I18nProps {
  translations: MessageTree;
}

const I18nContext = React.createContext<MessageTranslator | undefined>(undefined);

/**
 * A simple I18n component. This component uses a hierarchical tree of supplied messages to provide
 * translations via react hook. Any components requiring I18n support should be wrapped in this
 * component.
 *
 * The hook, useTranslate() returns a function that takes in a 'translation key'. These keys are
 * comprised of a path through the supplied message tree, with dot-separated names. For example,
 * for the translation tree
 *
 * <pre>
 *   {
 *     'a': {
 *       'b': {
 *         'c': 'D'
 *       }
 *     }
 *   }
 * </pre>
 *
 * the key for the translation "D" would be "a.b.c".
 *
 * Substitution tokens are denoted by "{substitutionKey}" within the translation text, and are
 * supplied via the corresponding value from the supplied `data` parameter. If a key is missing,
 * the token will not be replaced. If the supplied value begins with the prefix "i18n:", the
 * following text will itself be interpreted as a translation key.
 *
 * @param messages the messages to use
 * @param children child components
 * @constructor
 */
export function I18n({ translations, children }: React.PropsWithChildren<I18nProps>) {
  const messageTranslator = new MessageTranslator(translations);
  return <I18nContext.Provider value={messageTranslator}>{children}</I18nContext.Provider>;
}

export function useTranslate(): TranslateFunction {
  const translator = useContext(I18nContext);
  if (translator === undefined) {
    throw new Error('I18n not available. Ensure this component is wrapped in an instance of I18N');
  }
  return (key: string, data?: { [key: string]: string }) => translator.translate(key, data);
}

const RECURSIVE_I18N_PREFIX = 'i18n:';

export class MessageTranslator {
  private readonly _messages: MessageTree;

  constructor(messages: MessageTree) {
    this._messages = messages;
  }

  public translate(translationKey: string, data?: { [key: string]: string }) {
    const segments = translationKey.split('.');

    let pointer: MessageTree = this._messages;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const resolved = pointer[segment];
      if (resolved === undefined) {
        return translationKey;
      } else if (typeof resolved === 'string') {
        if (i !== segments.length - 1) {
          // reaching a leaf before the final segment terminates without a match
          return translationKey;
        } else {
          return this.performReplacement(resolved, data);
        }
      } else {
        pointer = resolved;
      }
    }
    return translationKey;
  }

  private performReplacement(input: string, data?: { [key: string]: string }): string {
    const tokenRegex = /([^{])?(\{([a-zA-Z0-9:\[\].-]+)})/g;
    let value = input;
    let capture = tokenRegex.exec(value);
    const replacedContent = [];
    while (capture !== null) {
      const startIndex = capture.index;
      const prefix = capture[1];
      const tokenKey = capture[3];
      const following = value.slice(tokenRegex.lastIndex);
      replacedContent.push(value.slice(0, startIndex));
      replacedContent.push(prefix);
      let replacementValue = data?.[tokenKey];
      if (tokenKey.startsWith(RECURSIVE_I18N_PREFIX)) {
        const recursiveTranslationKeyWithTokens = tokenKey
          .slice(RECURSIVE_I18N_PREFIX.length)
          .replaceAll('[', '{')
          .replaceAll(']', '}');
        const recursiveTranslationKey = this.performReplacement(
          recursiveTranslationKeyWithTokens,
          data,
        );
        replacementValue = this.translate(recursiveTranslationKey, data);
      } else if (replacementValue === undefined) {
        replacementValue = tokenKey;
      }
      replacedContent.push(replacementValue);
      value = following;
      tokenRegex.lastIndex = 0;
      capture = tokenRegex.exec(value);
    }
    return replacedContent.join('') + value;
  }
}
