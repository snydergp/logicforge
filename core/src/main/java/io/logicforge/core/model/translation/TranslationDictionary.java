package io.logicforge.core.model.translation;

import io.logicforge.core.constant.EngineMethodType;

import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.BiFunction;

public class TranslationDictionary implements Map<String, Object> {

    private static final String TYPES = "types";
    private static final String ACTIONS = "actions";
    private static final String FUNCTIONS = "functions";
    private static final String PARAMETERS = "parameters";

    private static final String TITLE = "title";
    private static final String DESCRIPTION = "description";

    private final Map<String, Object> root;

    public TranslationDictionary() {
        this.root = new HashMap<>();
    }

    public void addTypeTitle(final String typeName, final String title) {
        addPath(title, TYPES, typeName, TITLE);
    }

    public void addTypeDescription(final String typeName, final String description) {
        addPath(description, TYPES, typeName, DESCRIPTION);
    }

    public void addTitle(final EngineMethodType type, final String name, final String title) {
        addPath(title, segmentForType(type), name, TITLE);
    }

    public void addDescription(final EngineMethodType type, final String name, final String description) {
        addPath(description, segmentForType(type), name, DESCRIPTION);
    }

    public void addParameterTitle(final EngineMethodType type, final String name, final String paramName, final String title) {
        addPath(title, segmentForType(type), name, PARAMETERS, paramName, TITLE);
    }

    public void addParameterDescription(final EngineMethodType type, final String name, final String paramName, final String description) {
        addPath(description, segmentForType(type), name, PARAMETERS, paramName, DESCRIPTION);
    }

    private void addPath(final String translation, final String ... pathSegments) {
        if (pathSegments.length == 0) {
            throw new IllegalArgumentException("A minimum of 1 path segment must be provided");
        }
        final String[] parentPath = Arrays.copyOfRange(pathSegments, 0 , pathSegments.length - 1);
        final Map<String, Object> node = getNode(parentPath);
        final String translationName = pathSegments[pathSegments.length - 1];
        node.put(translationName, translation);
    }

    private Map<String, Object> getNode(final String ... pathSegments) {
        Map<String, Object> pointer = root;
        for (final String pathSegment : pathSegments) {
            final Object child = pointer.get(pathSegment);
            if (child == null) {
                final Map<String, Object> childMap = new HashMap<>();
                pointer.put(pathSegment, childMap);
                pointer = childMap;
            } else if (!(child instanceof Map)) {
                throw new IllegalStateException(
                        "Attempted to resolve node but found leaf: %s"
                                .formatted(String.join("/", pathSegments)));
            } else {
                pointer = (Map<String, Object>) child;
            }
        }
        return pointer;
    }

    @Override
    public int size() {
        return root.size();
    }

    @Override
    public boolean isEmpty() {
        return root.isEmpty();
    }

    @Override
    public boolean containsKey(final Object key) {
        return root.containsKey(key);
    }

    @Override
    public boolean containsValue(final Object value) {
        return root.containsValue(value);
    }

    @Override
    public Object get(final Object key) {
        return root.get(key);
    }

    @Override
    public Object put(final String key, final Object value) {
        return root.put(key, value);
    }

    @Override
    public Object remove(final Object key) {
        return root.remove(key);
    }

    @Override
    public void putAll(final Map<? extends String, ?> m) {
        root.putAll(m);
    }

    @Override
    public void clear() {
        root.clear();
    }

    @Override
    public Set<String> keySet() {
        return root.keySet();
    }

    @Override
    public Collection<Object> values() {
        return root.values();
    }

    @Override
    public Set<Entry<String, Object>> entrySet() {
        return root.entrySet();
    }

    @Override
    public boolean equals(final Object o) {
        return root.equals(o);
    }

    @Override
    public int hashCode() {
        return root.hashCode();
    }

    @Override
    public Object getOrDefault(final Object key, final Object defaultValue) {
        return root.getOrDefault(key, defaultValue);
    }

    @Override
    public void forEach(final BiConsumer<? super String, ? super Object> action) {
        root.forEach(action);
    }

    @Override
    public void replaceAll(final BiFunction<? super String, ? super Object, ?> function) {
        root.replaceAll(function);
    }

    @Override
    public Object putIfAbsent(final String key, final Object value) {
        return root.putIfAbsent(key, value);
    }

    @Override
    public boolean remove(final Object key, final Object value) {
        return root.remove(key, value);
    }

    private static String segmentForType(final EngineMethodType type) {
        switch (type) {
            case ACTION -> {
                return ACTIONS;
            }
            case FUNCTION -> {
                return FUNCTIONS;
            }
            default -> throw new IllegalStateException("Conversions are not exposed to users");
        }
    }

}
