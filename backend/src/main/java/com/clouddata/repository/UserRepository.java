package com.clouddata.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.clouddata.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}