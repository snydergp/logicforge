package io.logicforge.core.util;

import io.logicforge.core.annotations.metadata.Description;
import io.logicforge.core.annotations.metadata.Title;
import io.logicforge.core.common.Pair;
import io.logicforge.core.constant.EngineMethodType;
import io.logicforge.core.model.specification.ActionSpec;
import io.logicforge.core.model.specification.EngineSpec;
import io.logicforge.core.model.specification.FunctionSpec;
import io.logicforge.core.model.specification.InjectedParameterSpec;
import io.logicforge.core.model.specification.MethodSpec;
import io.logicforge.core.model.specification.ParameterSpec;
import io.logicforge.core.model.translation.TranslationDictionary;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class TranslationUtil {

    public static TranslationDictionary collectDefaultTranslations(final EngineSpec engineSpec) {
        final TranslationDictionary out = new TranslationDictionary();
        collectActions(engineSpec.getActions(), out);
        collectFunctions(engineSpec.getFunctions(), out);
        return out;
    }

    private static void collectActions(final Map<String, ActionSpec> specs, final TranslationDictionary dictionary) {
        specs.values().forEach(action -> collectAction(action, dictionary));
    }

    private static void collectAction(final ActionSpec spec, final TranslationDictionary dictionary) {
        final String actionName = spec.getName();
        collectMethod(EngineMethodType.ACTION, actionName, spec, dictionary);
    }

    private static void collectFunctions(final Map<String, FunctionSpec> specs, final TranslationDictionary dictionary) {
        specs.values().forEach(function -> collectFunction(function, dictionary));
    }

    private static void collectFunction(final FunctionSpec spec, final TranslationDictionary dictionary) {
        final String functionName = spec.getName();
        collectMethod(EngineMethodType.FUNCTION, functionName, spec, dictionary);
    }

    private static void collectMethod(final EngineMethodType type, String name, final MethodSpec spec, final TranslationDictionary dictionary) {
        final Method method = spec.getMethod();
        final Pair<Optional<String>, Optional<String>> actionTitleAndDescription = getTitleAndDescription(method);
        actionTitleAndDescription.getLeft()
                .ifPresent(title -> dictionary.addTitle(type, name, title));
        actionTitleAndDescription.getRight()
                .ifPresent(description -> dictionary.addTitle(type, name, description));
        final List<ParameterSpec> parameters = spec.getParameters();
        for (int i = 0; i < parameters.size(); i++) {
            final ParameterSpec parameter = parameters.get(i);
            if (parameter instanceof InjectedParameterSpec) {
                continue; // injected parameters aren't exposed to users and therefore don't have translations
            }
            final String parameterName = parameter.getName();
            final Pair<Optional<String>, Optional<String>> paramTitleAndDescription =
                    getTitleAndDescription(method.getParameters()[i]);
            paramTitleAndDescription.getLeft().ifPresent(title ->
                    dictionary.addParameterTitle(type, name, parameterName, title));
            paramTitleAndDescription.getRight().ifPresent(description ->
                    dictionary.addParameterDescription(type, name, parameterName, description));
        }
    }

    private static Pair<Optional<String>, Optional<String>> getTitleAndDescription(final Method method) {
        final Optional<String> title = Optional.ofNullable(method.getAnnotation(Title.class))
                .map(Title::value);
        final Optional<String> description = Optional.ofNullable(method.getAnnotation(Description.class))
                .map(Description::value);
        return new Pair<>(title, description);
    }

    private static Pair<Optional<String>, Optional<String>> getTitleAndDescription(final Parameter parameter) {
        final Optional<String> title = Optional.ofNullable(parameter.getAnnotation(Title.class))
                .map(Title::value);
        final Optional<String> description = Optional.ofNullable(parameter.getAnnotation(Description.class))
                .map(Description::value);
        return new Pair<>(title, description);
    }

}
