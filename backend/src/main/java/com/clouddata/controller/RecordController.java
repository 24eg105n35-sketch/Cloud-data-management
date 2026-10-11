package com.clouddata.controller;

import com.clouddata.entity.User;
import com.clouddata.model.Record;
import com.clouddata.repository.RecordRepository;
import com.clouddata.service.BPlusTreeService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class RecordController {

    private final RecordRepository recordRepository;

    private final BPlusTreeService bPlusTreeService;

    public RecordController(
            RecordRepository recordRepository,
            BPlusTreeService bPlusTreeService
    ) {

        this.recordRepository =
                recordRepository;

        this.bPlusTreeService =
                bPlusTreeService;
    }

    // =====================================================
    // ADD RECORD
    // =====================================================

    @PostMapping("/records")
    public ResponseEntity<?> addRecord(
            @RequestBody Record record,
            @AuthenticationPrincipal User user
    ) {

        if (record.getRecordKey() == null) {

            return ResponseEntity
                    .badRequest()
                    .body("Record key is required.");
        }

        if (record.getName() == null
                || record.getName().isBlank()) {

            return ResponseEntity
                    .badRequest()
                    .body("Name is required.");
        }

        // Check record key only for the logged-in user
        if (recordRepository
                .existsByOwnerEmailAndRecordKey(
                        user.getEmail(),
                        record.getRecordKey()
                )) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "Record key already exists for your account."
                    );
        }

        // IMPORTANT:
        // Assign the logged-in user as owner
        record.setOwner(user);

        Record saved =
                recordRepository.save(record);

        // Insert into this user's B+ Tree
        bPlusTreeService.insert(
                user.getEmail(),
                saved
        );

        return ResponseEntity.ok(saved);
    }

    // =====================================================
    // GET ALL RECORDS OF LOGGED-IN USER
    // =====================================================

    @GetMapping("/records")
    public ResponseEntity<List<Record>>
    getAllRecords(
            @AuthenticationPrincipal User user
    ) {

        return ResponseEntity.ok(
                recordRepository
                        .findByOwnerEmailOrderByRecordKeyAsc(
                                user.getEmail()
                        )
        );
    }

    // =====================================================
    // SEARCH USING B+ TREE
    // =====================================================

    @GetMapping("/records/{key}")
    public ResponseEntity<?> searchRecord(
            @PathVariable Integer key,
            @AuthenticationPrincipal User user
    ) {

        Map<String, Object> result =
                bPlusTreeService.search(
                        user.getEmail(),
                        key
                );

        if (result == null) {

            return ResponseEntity
                    .notFound()
                    .build();
        }

        return ResponseEntity.ok(
                Map.of(
                        "found", true,
                        "key", key,
                        "value", result
                )
        );
    }

    // =====================================================
    // RANGE SEARCH USING B+ TREE
    // =====================================================

    @GetMapping("/records/range")
    public ResponseEntity<?> rangeSearch(
            @RequestParam Integer startKey,
            @RequestParam Integer endKey,
            @AuthenticationPrincipal User user
    ) {

        if (startKey > endKey) {

            return ResponseEntity
                    .badRequest()
                    .body(
                            "Start key must be less than or equal to end key."
                    );
        }

        return ResponseEntity.ok(
                bPlusTreeService.rangeSearch(
                        user.getEmail(),
                        startKey,
                        endKey
                )
        );
    }

    // =====================================================
    // DELETE
    // =====================================================

    @DeleteMapping("/records/{key}")
    public ResponseEntity<?> deleteRecord(
            @PathVariable Integer key,
            @AuthenticationPrincipal User user
    ) {

        var record =
                recordRepository
                        .findByOwnerEmailAndRecordKey(
                                user.getEmail(),
                                key
                        );

        if (record.isEmpty()) {

            return ResponseEntity
                    .notFound()
                    .build();
        }

        recordRepository.delete(
                record.get()
        );

        bPlusTreeService.delete(
                user.getEmail(),
                key
        );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Record deleted successfully.",
                        "key",
                        key
                )
        );
    }

    // =====================================================
    // B+ TREE STATISTICS
    // =====================================================

    @GetMapping("/tree/statistics")
    public ResponseEntity<Map<String, Object>>
    getStatistics(
            @AuthenticationPrincipal User user
    ) {

        return ResponseEntity.ok(
                bPlusTreeService
                        .getStatistics(
                                user.getEmail()
                        )
        );
    }

    // =====================================================
    // ACTUAL B+ TREE STRUCTURE
    // =====================================================

    @GetMapping("/tree")
    public ResponseEntity<Map<String, Object>>
    getTree(
            @AuthenticationPrincipal User user
    ) {

        return ResponseEntity.ok(
                bPlusTreeService
                        .getTreeStructure(
                                user.getEmail()
                        )
        );
    }

    // =====================================================
    // SEARCH PATH
    // =====================================================

    @GetMapping("/tree/search-path/{key}")
    public ResponseEntity<Map<String, Object>>
    getSearchPath(
            @PathVariable Integer key,
            @AuthenticationPrincipal User user
    ) {

        return ResponseEntity.ok(
                bPlusTreeService
                        .getSearchPath(
                                user.getEmail(),
                                key
                        )
        );
    }

    // =====================================================
    // B+ TREE RECORDS
    // =====================================================

    @GetMapping("/tree/records")
    public ResponseEntity<List<Map<String, Object>>>
    getTreeRecords(
            @AuthenticationPrincipal User user
    ) {

        return ResponseEntity.ok(
                bPlusTreeService
                        .getAll(
                                user.getEmail()
                        )
        );
    }
}