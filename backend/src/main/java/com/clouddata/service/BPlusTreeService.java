package com.clouddata.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.clouddata.bplustree.BPlusTree;
import com.clouddata.model.Record;
import com.clouddata.repository.RecordRepository;

@Service
public class BPlusTreeService {

    private final RecordRepository recordRepository;

    // =====================================================
    // ONE B+ TREE FOR EACH USER
    // =====================================================

    private final Map<String, BPlusTree> userTrees =
            new ConcurrentHashMap<>();

    public BPlusTreeService(
            RecordRepository recordRepository
    ) {

        this.recordRepository =
                recordRepository;

        loadRecordsIntoTrees();
    }

    // =====================================================
    // LOAD MYSQL RECORDS INTO USER-SPECIFIC B+ TREES
    // =====================================================

    private void loadRecordsIntoTrees() {

        List<Record> records =
                recordRepository.findAll();

        for (Record record : records) {

            if (record.getOwner() == null) {
                continue;
            }

            String email =
                    record.getOwner().getEmail();

            BPlusTree tree =
                    userTrees.computeIfAbsent(
                            email,
                            key -> new BPlusTree(4)
                    );

            tree.insert(
                    record.getRecordKey(),
                    toMap(record)
            );
        }

        System.out.println(
                "Loaded "
                        + records.size()
                        + " records into user-specific B+ Trees."
        );
    }

    // =====================================================
    // GET USER TREE
    // =====================================================

    private BPlusTree getUserTree(
            String email
    ) {

        return userTrees.computeIfAbsent(
                email,
                key -> new BPlusTree(4)
        );
    }

    // =====================================================
    // CONVERT RECORD TO MAP
    // =====================================================

    private Map<String, Object> toMap(
            Record record
    ) {

        Map<String, Object> data =
                new LinkedHashMap<>();

        data.put(
                "id",
                record.getId()
        );

        data.put(
                "recordKey",
                record.getRecordKey()
        );

        data.put(
                "name",
                record.getName()
        );

        data.put(
                "data",
                record.getData()
        );

        data.put(
                "createdAt",
                record.getCreatedAt()
        );

        return data;
    }

    // =====================================================
    // INSERT
    // =====================================================

    public void insert(
            String email,
            Record record
    ) {

        BPlusTree tree =
                getUserTree(email);

        tree.insert(
                record.getRecordKey(),
                toMap(record)
        );
    }

    // =====================================================
    // SEARCH
    // =====================================================

    public Map<String, Object> search(
            String email,
            Integer key
    ) {

        BPlusTree tree =
                getUserTree(email);

        return tree.search(key);
    }

    // =====================================================
    // RANGE SEARCH
    // =====================================================

    public List<Map<String, Object>> rangeSearch(
            String email,
            Integer startKey,
            Integer endKey
    ) {

        BPlusTree tree =
                getUserTree(email);

        return tree.rangeSearch(
                startKey,
                endKey
        );
    }

    // =====================================================
    // GET ALL
    // =====================================================

    public List<Map<String, Object>> getAll(
            String email
    ) {

        BPlusTree tree =
                getUserTree(email);

        return tree.getAll();
    }

    // =====================================================
    // DELETE
    // =====================================================

    public boolean delete(
            String email,
            Integer key
    ) {

        BPlusTree tree =
                getUserTree(email);

        return tree.delete(key);
    }

    // =====================================================
    // TREE STATISTICS
    // =====================================================

    public Map<String, Object> getStatistics(
            String email
    ) {

        BPlusTree tree =
                getUserTree(email);

        return tree.getStatistics();
    }

    // =====================================================
    // TREE VISUALIZATION
    // =====================================================

    public Map<String, Object> getTreeStructure(
            String email
    ) {

        BPlusTree tree =
                getUserTree(email);

        return tree.getTreeStructure();
    }

    // =====================================================
    // SEARCH PATH
    // =====================================================

    public Map<String, Object> getSearchPath(
            String email,
            Integer key
    ) {

        BPlusTree tree =
                getUserTree(email);

        return tree.getSearchPath(key);
    }

    // =====================================================
    // GET USER TREE
    // =====================================================

    public BPlusTree getTree(
            String email
    ) {

        return getUserTree(email);
    }
    // =====================================================
// REMOVE USER TREE
// =====================================================

public void removeUserTree(
        String email
) {

    userTrees.remove(email);
}
}