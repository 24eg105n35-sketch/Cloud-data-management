package com.clouddata.bplustree;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class BPlusTree {

    // =========================================================
    // CONFIGURATION
    // =========================================================

    private final int order;

    private Node root;

    private int nodeIdCounter = 0;

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    public BPlusTree() {
        this(4);
    }

    public BPlusTree(int order) {

        if (order < 3) {
            throw new IllegalArgumentException(
                    "B+ Tree order must be at least 3"
            );
        }

        this.order = order;

        root = new Node(true);
    }

    // =========================================================
    // NODE
    // =========================================================

    private static class Node {

        boolean leaf;

        List<Integer> keys = new ArrayList<>();

        // Used by internal nodes
        List<Node> children = new ArrayList<>();

        // Used by leaf nodes
        List<Map<String, Object>> values =
                new ArrayList<>();

        // Linked-list pointer between leaf nodes
        Node next;

        Node(boolean leaf) {
            this.leaf = leaf;
        }
    }

    // =========================================================
    // INSERT
    // =========================================================

    public synchronized void insert(
            int key,
            Map<String, Object> value) {

        // Update existing key
        Map<String, Object> existing =
                search(key);

        if (existing != null) {

            Node leaf = findLeaf(key);

            for (int i = 0; i < leaf.keys.size(); i++) {

                if (leaf.keys.get(i) == key) {

                    leaf.values.set(i, value);

                    return;
                }
            }
        }

        // Root full
        if (root.keys.size() >= order - 1) {

            Node newRoot = new Node(false);

            newRoot.children.add(root);

            root = newRoot;

            splitChild(newRoot, 0);
        }

        insertNonFull(
                root,
                key,
                value
        );
    }

    // =========================================================
    // INSERT INTO NON-FULL NODE
    // =========================================================

    private void insertNonFull(
            Node node,
            int key,
            Map<String, Object> value) {

        if (node.leaf) {

            int position = 0;

            while (
                    position < node.keys.size()
                            && node.keys.get(position) < key) {

                position++;
            }

            node.keys.add(position, key);

            node.values.add(position, value);

            return;
        }

        int childIndex = findChildIndex(
                node,
                key
        );

        Node child =
                node.children.get(childIndex);

        if (child.keys.size() >= order - 1) {

            splitChild(
                    node,
                    childIndex
            );

            if (key >= node.keys.get(childIndex)) {
                childIndex++;
            }
        }

        insertNonFull(
                node.children.get(childIndex),
                key,
                value
        );
    }

    // =========================================================
    // FIND CHILD INDEX
    // =========================================================

    private int findChildIndex(
            Node node,
            int key) {

        int index = 0;

        while (
                index < node.keys.size()
                        && key >= node.keys.get(index)) {

            index++;
        }

        return index;
    }

    // =========================================================
    // SPLIT CHILD
    // =========================================================

    private void splitChild(
            Node parent,
            int childIndex) {

        Node child =
                parent.children.get(childIndex);

        Node newNode =
                new Node(child.leaf);

        int mid =
                child.keys.size() / 2;

        if (child.leaf) {

            // ---------------------------------------------
            // LEAF SPLIT
            // ---------------------------------------------

            for (
                    int i = mid;
                    i < child.keys.size();
                    i++) {

                newNode.keys.add(
                        child.keys.get(i)
                );

                newNode.values.add(
                        child.values.get(i)
                );
            }

            while (child.keys.size() > mid) {

                child.keys.remove(
                        child.keys.size() - 1
                );

                child.values.remove(
                        child.values.size() - 1
                );
            }

            // Link leaf nodes
            newNode.next = child.next;

            child.next = newNode;

            // Separator key
            parent.keys.add(
                    childIndex,
                    newNode.keys.get(0)
            );

            parent.children.add(
                    childIndex + 1,
                    newNode
            );

        } else {

            // ---------------------------------------------
            // INTERNAL NODE SPLIT
            // ---------------------------------------------

            int promotedKey =
                    child.keys.get(mid);

            for (
                    int i = mid + 1;
                    i < child.keys.size();
                    i++) {

                newNode.keys.add(
                        child.keys.get(i)
                );
            }

            for (
                    int i = mid + 1;
                    i < child.children.size();
                    i++) {

                newNode.children.add(
                        child.children.get(i)
                );
            }

            while (child.keys.size() > mid) {

                child.keys.remove(
                        child.keys.size() - 1
                );
            }

            while (
                    child.children.size()
                            > mid + 1) {

                child.children.remove(
                        child.children.size() - 1
                );
            }

            parent.keys.add(
                    childIndex,
                    promotedKey
            );

            parent.children.add(
                    childIndex + 1,
                    newNode
            );
        }
    }

    // =========================================================
    // SEARCH
    // =========================================================

    public synchronized Map<String, Object> search(
            int key) {

        Node leaf = findLeaf(key);

        for (int i = 0; i < leaf.keys.size(); i++) {

            if (leaf.keys.get(i) == key) {

                return leaf.values.get(i);
            }
        }

        return null;
    }

    // =========================================================
    // FIND LEAF
    // =========================================================

    private Node findLeaf(int key) {

        Node current = root;

        while (!current.leaf) {

            int index =
                    findChildIndex(
                            current,
                            key
                    );

            current =
                    current.children.get(index);
        }

        return current;
    }

    // =========================================================
    // RANGE SEARCH
    // =========================================================

    public synchronized List<Map<String, Object>> rangeSearch(
            int startKey,
            int endKey) {

        List<Map<String, Object>> results =
                new ArrayList<>();

        if (startKey > endKey) {
            return results;
        }

        Node current =
                findLeaf(startKey);

        while (current != null) {

            for (int i = 0;
                 i < current.keys.size();
                 i++) {

                int key =
                        current.keys.get(i);

                if (key > endKey) {

                    return results;
                }

                if (key >= startKey) {

                    Map<String, Object> result =
                            new LinkedHashMap<>();

                    result.put(
                            "key",
                            key
                    );

                    result.put(
                            "value",
                            current.values.get(i)
                    );

                    results.add(result);
                }
            }

            current = current.next;
        }

        return results;
    }

    // =========================================================
    // GET ALL
    // =========================================================

    public synchronized List<Map<String, Object>> getAll() {

        List<Map<String, Object>> results =
                new ArrayList<>();

        Node current = root;

        while (!current.leaf) {

            current =
                    current.children.get(0);
        }

        while (current != null) {

            for (int i = 0;
                 i < current.keys.size();
                 i++) {

                Map<String, Object> result =
                        new LinkedHashMap<>();

                result.put(
                        "key",
                        current.keys.get(i)
                );

                result.put(
                        "value",
                        current.values.get(i)
                );

                results.add(result);
            }

            current = current.next;
        }

        return results;
    }

    // =========================================================
    // DELETE
    // =========================================================

    public synchronized boolean delete(
            int key) {

        Map<String, Object> existing =
                search(key);

        if (existing == null) {
            return false;
        }

        /*
         * For reliable academic demonstration, deletion rebuilds
         * the tree from the remaining records.
         *
         * This guarantees that the resulting B+ Tree remains
         * structurally valid without implementing the much more
         * complex borrow/merge deletion algorithm.
         */

        List<Map<String, Object>> remaining =
                new ArrayList<>();

        Node current = root;

        while (!current.leaf) {
            current =
                    current.children.get(0);
        }

        while (current != null) {

            for (int i = 0;
                 i < current.keys.size();
                 i++) {

                if (current.keys.get(i) != key) {

                    Map<String, Object> entry =
                            new LinkedHashMap<>();

                    entry.put(
                            "key",
                            current.keys.get(i)
                    );

                    entry.put(
                            "value",
                            current.values.get(i)
                    );

                    remaining.add(entry);
                }
            }

            current = current.next;
        }

        // Create fresh tree
        root = new Node(true);

        for (Map<String, Object> entry : remaining) {

            int entryKey =
                    ((Number) entry.get("key"))
                            .intValue();

            @SuppressWarnings("unchecked")
            Map<String, Object> entryValue =
                    (Map<String, Object>)
                            entry.get("value");

            insert(
                    entryKey,
                    entryValue
            );
        }

        return true;
    }

    // =========================================================
    // TREE INFORMATION
    // =========================================================

    public synchronized Map<String, Object> getStatistics() {

        Map<String, Object> statistics =
                new LinkedHashMap<>();

        statistics.put(
                "order",
                order
        );

        statistics.put(
                "height",
                getHeight()
        );

        statistics.put(
                "totalNodes",
                countNodes()
        );

        statistics.put(
                "leafNodes",
                countLeafNodes()
        );

        statistics.put(
                "totalRecords",
                getAll().size()
        );

        return statistics;
    }

    // =========================================================
    // TREE HEIGHT
    // =========================================================

    private int getHeight() {

        int height = 1;

        Node current = root;

        while (!current.leaf) {

            height++;

            current =
                    current.children.get(0);
        }

        return height;
    }

    // =========================================================
    // COUNT NODES
    // =========================================================

    private int countNodes() {

        return countNodesRecursive(root);
    }

    private int countNodesRecursive(
            Node node) {

        int count = 1;

        if (!node.leaf) {

            for (Node child : node.children) {

                count +=
                        countNodesRecursive(child);
            }
        }

        return count;
    }

    // =========================================================
    // COUNT LEAF NODES
    // =========================================================

    private int countLeafNodes() {

        return countLeafNodesRecursive(root);
    }

    private int countLeafNodesRecursive(
            Node node) {

        if (node.leaf) {
            return 1;
        }

        int count = 0;

        for (Node child : node.children) {

            count +=
                    countLeafNodesRecursive(child);
        }

        return count;
    }

    // =========================================================
    // TREE VISUALIZATION
    // =========================================================

    public synchronized Map<String, Object>
    getTreeStructure() {

        nodeIdCounter = 0;

        Map<Node, Integer> ids =
                new HashMap<>();

        List<Map<String, Object>> nodes =
                new ArrayList<>();

        List<List<Map<String, Object>>> levels =
                new ArrayList<>();

        buildTreeStructure(
                root,
                0,
                null,
                ids,
                nodes,
                levels
        );

        // Add next-leaf references
        for (Map<String, Object> nodeData : nodes) {

            Integer nodeId =
                    (Integer) nodeData.get("id");

            Node originalNode =
                    findNodeById(
                            root,
                            nodeId,
                            ids
                    );

            if (
                    originalNode != null
                            && originalNode.leaf
            ) {

                if (originalNode.next != null) {

                    nodeData.put(
                            "nextId",
                            ids.get(
                                    originalNode.next
                            )
                    );

                } else {

                    nodeData.put(
                            "nextId",
                            null
                    );
                }
            }
        }

        Map<String, Object> result =
                new LinkedHashMap<>();

        result.put(
                "order",
                order
        );

        result.put(
                "rootId",
                ids.get(root)
        );

        result.put(
                "height",
                getHeight()
        );

        result.put(
                "totalNodes",
                countNodes()
        );

        result.put(
                "leafNodes",
                countLeafNodes()
        );

        result.put(
                "levels",
                levels
        );

        result.put(
                "nodes",
                nodes
        );

        return result;
    }

    // =========================================================
    // BUILD VISUALIZATION DATA
    // =========================================================

    private void buildTreeStructure(
            Node node,
            int level,
            Integer parentId,
            Map<Node, Integer> ids,
            List<Map<String, Object>> nodes,
            List<List<Map<String, Object>>> levels) {

        if (levels.size() <= level) {

            levels.add(
                    new ArrayList<>()
            );
        }

        int id =
                nodeIdCounter++;

        ids.put(
                node,
                id
        );

        Map<String, Object> nodeData =
                new LinkedHashMap<>();

        nodeData.put(
                "id",
                id
        );

        nodeData.put(
                "level",
                level
        );

        nodeData.put(
                "leaf",
                node.leaf
        );

        nodeData.put(
                "keys",
                new ArrayList<>(node.keys)
        );

        nodeData.put(
                "parentId",
                parentId
        );

        if (node.leaf) {

            nodeData.put(
                    "recordCount",
                    node.values.size()
            );
        } else {

            List<Integer> childIds =
                    new ArrayList<>();

            for (Node child : node.children) {

                Integer childId =
                        ids.get(child);

                if (childId == null) {

                    buildTreeStructure(
                            child,
                            level + 1,
                            id,
                            ids,
                            nodes,
                            levels
                    );

                    childId =
                            ids.get(child);
                }

                childIds.add(childId);
            }

            nodeData.put(
                    "children",
                    childIds
            );
        }

        nodes.add(nodeData);

        levels.get(level).add(nodeData);
    }

    // =========================================================
    // FIND NODE BY ID
    // =========================================================

    private Node findNodeById(
            Node current,
            int targetId,
            Map<Node, Integer> ids) {

        Integer currentId =
                ids.get(current);

        if (
                currentId != null
                        && currentId == targetId
        ) {

            return current;
        }

        if (!current.leaf) {

            for (Node child : current.children) {

                Node result =
                        findNodeById(
                                child,
                                targetId,
                                ids
                        );

                if (result != null) {
                    return result;
                }
            }
        }

        return null;
    }

    // =========================================================
    // SEARCH PATH
    // =========================================================

    public synchronized Map<String, Object>
    getSearchPath(int key) {

        List<Map<String, Object>> path =
                new ArrayList<>();

        Node current = root;

        while (true) {

            Map<String, Object> nodeInfo =
                    new LinkedHashMap<>();

            nodeInfo.put(
                    "leaf",
                    current.leaf
            );

            nodeInfo.put(
                    "keys",
                    new ArrayList<>(
                            current.keys
                    )
            );

            path.add(nodeInfo);

            if (current.leaf) {
                break;
            }

            int childIndex =
                    findChildIndex(
                            current,
                            key
                    );

            current =
                    current.children.get(
                            childIndex
                    );
        }

        boolean found =
                search(key) != null;

        Map<String, Object> result =
                new LinkedHashMap<>();

        result.put(
                "key",
                key
        );

        result.put(
                "found",
                found
        );

        result.put(
                "path",
                path
        );

        return result;
    }

    // =========================================================
    // GET ORDER
    // =========================================================

    public int getOrder() {
        return order;
    }
}