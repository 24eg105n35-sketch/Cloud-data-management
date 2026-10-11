package com.clouddata.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.clouddata.model.Record;

public interface RecordRepository
        extends JpaRepository<Record, Long> {

    Optional<Record> findByOwnerEmailAndRecordKey(
            String email,
            Integer recordKey
    );

    boolean existsByOwnerEmailAndRecordKey(
            String email,
            Integer recordKey
    );

    List<Record> findByOwnerEmailOrderByRecordKeyAsc(
            String email
    );

    List<Record> findByOwnerEmailAndRecordKeyBetweenOrderByRecordKeyAsc(
            String email,
            Integer startKey,
            Integer endKey
    );

    void deleteAllByOwnerEmail(String email);

    List<Record> findAllByOrderByRecordKeyAsc();
}