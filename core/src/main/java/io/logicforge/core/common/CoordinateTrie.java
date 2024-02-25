package io.logicforge.core.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * A very minimal trie implementation used for tracking parent-child coordinate relationships
 *
 * @param <V>
 */
@RequiredArgsConstructor
public class CoordinateTrie<V> {
    private TrieNode root;

    public void put(final Coordinates coordinates, final V value) {
        Objects.requireNonNull(resolveNode(coordinates, true)).setValue(value);
    }

    public V get(final Coordinates coordinates) {
        final TrieNode trieNode = resolveNode(coordinates, false);
        return trieNode != null ? trieNode.getValue() : null;
    }

    public V remove(final Coordinates coordinates) {
        final TrieNode trieNode = resolveNode(coordinates.getParent(), false);
        if (trieNode != null) {
            final TrieNode removed = trieNode.removeChild(coordinates.getFinalIndex());
            return removed != null ? removed.getValue() : null;
        }
        return null;
    }

    public List<V> values() {
        final List<TrieNode> nodes = new ArrayList<>();
        listRecursive(root, nodes, -1);
        return nodes.stream().map(TrieNode::getValue)
                .filter(Objects::nonNull).collect(Collectors.toList());
    }

    public List<V> listDescendants(final Coordinates root) {
        final List<TrieNode> depthFirstChildren = new ArrayList<>();
        final TrieNode rootNode = resolveNode(root, false);
        if (rootNode != null) {
            rootNode.getOrderedChildren().forEach(child -> listRecursive(child, depthFirstChildren, -1));
        }
        return depthFirstChildren.stream().map(TrieNode::getValue).filter(Objects::nonNull).collect(Collectors.toList());
    }

    public List<V> listChildren(final Coordinates root) {
        final List<TrieNode> depthFirstChildren = new ArrayList<>();
        final TrieNode rootNode = resolveNode(root, false);
        if (rootNode != null) {
            rootNode.getOrderedChildren().forEach(child -> listRecursive(child, depthFirstChildren, 1));
        }
        return depthFirstChildren.stream().map(TrieNode::getValue).filter(Objects::nonNull).collect(Collectors.toList());
    }

    private void listRecursive(final TrieNode node, final List<TrieNode> out, final int depth) {
        out.add(node);
        if (depth != 1) {
            node.getOrderedChildren()
                    .forEach(childNode -> listRecursive(childNode, out, depth - 1));
        }
    }

    private TrieNode resolveNode(final Coordinates coordinates, boolean createIfAbsent) {
        if (root == null) {
            final Coordinates rootIndex = Coordinates.ROOT;
            root = new TrieNode(rootIndex);
        }
        TrieNode pointer = root;
        for (final Integer coordinate : coordinates) {
            if (pointer == null) {
                return null;
            }
            TrieNode child = pointer.getChild(coordinate);
            if (child == null && createIfAbsent) {
                child = pointer.addChild(coordinate);
            }
            pointer = child;
        }
        return pointer;
    }

    @RequiredArgsConstructor
    private class TrieNode {
        @Getter
        private final Coordinates coordinates;
        @Getter @Setter
        private V value;
        private final Map<Integer, TrieNode> childNodes = new TreeMap<>();

        public TrieNode getChild(final Integer coordinate) {
            return childNodes.get(coordinate);
        }

        public TrieNode addChild(final Integer coordinate) {
            final TrieNode child = new TrieNode(coordinates.getNthChild(coordinate));
            childNodes.put(coordinate, child);
            return child;
        }

        public TrieNode removeChild(final Integer coordinate) {
            return childNodes.remove(coordinate);
        }

        public List<TrieNode> getOrderedChildren() {
            return new ArrayList<>(childNodes.values());
        }
    }

}
