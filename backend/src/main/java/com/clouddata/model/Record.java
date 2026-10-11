package com.clouddata.model;

import java.time.LocalDateTime;

import com.clouddata.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "records",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_record_owner_key",
                        columnNames = {"owner_id", "record_key"}
                )
        }
)
public class Record {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "record_key", nullable = false)
    private Integer recordKey;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String data;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // =====================================================
    // RECORD OWNER
    // =====================================================

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(
            name = "owner_id",
            nullable = false
    )
    private User owner;

    // =====================================================
    // CONSTRUCTORS
    // =====================================================

    public Record() {
    }

    public Record(
            Integer recordKey,
            String name,
            String data
    ) {
        this.recordKey = recordKey;
        this.name = name;
        this.data = data;
    }

    // =====================================================
    // CREATED DATE
    // =====================================================

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // =====================================================
    // GETTERS AND SETTERS
    // =====================================================

    public Long getId() {
        return id;
    }

    public Integer getRecordKey() {
        return recordKey;
    }

    public void setRecordKey(Integer recordKey) {
        this.recordKey = recordKey;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }
}