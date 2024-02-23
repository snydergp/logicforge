package io.logicforge.core.common;

import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
import java.util.Arrays;
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

    public void put(final int[] keys, final V value) {
        Objects.requireNonNull(resolveNode(keys, true)).setValue(value);
    }

    public V get(final int[] keys) {
        final TrieNode trieNode = resolveNode(keys, false);
        return trieNode != null ? trieNode.getValue() : null;
    }

    public List<V> values() {
        final List<TrieNode> nodes = new ArrayList<>();
        listRecursive(root, nodes, -1);
        return nodes.stream().map(TrieNode::getValue)
                .filter(Objects::nonNull).collect(Collectors.toList());
    }

    /**
     * Returns all values below the supplied key, to the given relative depth
     *
     * @param key the root key
     * @param depth the amount of levels below the root key to traverse. A depth of 0 or less will return all values
     * @return child values
     */
    public List<V> listChildValues(final int[] key, final int depth) {
        return listChildrenDepthFirst(key, depth).stream().map(TrieNode::getValue)
                .filter(Objects::nonNull).collect(Collectors.toList());
    }

    private List<TrieNode> listChildrenDepthFirst(final int[] key, final int depth) {
        final List<TrieNode> childNodes = new ArrayList<>();
        final TrieNode trieNode = key == null ? root : resolveNode(key, false);
        if (trieNode != null) {
            trieNode.getChildNodes().values()
                    .forEach(childNode -> listRecursive(childNode, childNodes, depth));
        }
        return childNodes;
    }

    private void listRecursive(final TrieNode node, final List<TrieNode> out, final int depth) {
        out.add(node);
        if (depth != 1) {
            node.getChildNodes().values()
                    .forEach(childNode -> listRecursive(childNode, out, depth - 1));
        }
    }

    private TrieNode resolveNode(final int[] keys, boolean createIfAbsent) {
        if (root == null) {
            final int[] rootIndex = Arrays.copyOf(keys, 0);
            root = new TrieNode(rootIndex);
        }
        TrieNode pointer = root;
        for (int i = 0; i < keys.length; i++) {
            final int keySegment = keys[i];
            if (pointer == null) {
                return null;
            }
            TrieNode trieNode = pointer.getChildNodes().get(keySegment);
            if (trieNode == null && createIfAbsent) {
                final int[] newIndex = Arrays.copyOf(keys, i + 1);
                trieNode = new TrieNode(newIndex);
                pointer.getChildNodes().put(keySegment, trieNode);
            }
            pointer = trieNode;
        }
        return pointer;
    }

    @Data
    private class TrieNode {
        private final int[] key;
        private V value;
        private final Map<Integer, TrieNode> childNodes = new TreeMap<>();
    }

}
